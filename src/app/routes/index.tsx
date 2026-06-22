import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useNavigate } from "react-router-dom";
import { SideNav } from "@/app/components/SideNav";
import { ToastProvider, useToast } from "@/app/components/Toast";
import { DocumentViewerModal } from "@/app/components/DocumentViewerModal";
import { useSession } from "@/app/queries/useSession";
import { useArchiveDocument, useDocuments } from "@/app/queries/useDocuments";
import { useFavorites, useToggleFavorite } from "@/app/queries/useFavorites";
import { useDownloadDocument } from "@/app/queries/useCatalog";
import { useAsk } from "@/app/queries/useAsk";
import { AskSearch } from "@/app/routes/AskSearch";
import { Library } from "@/app/routes/Library";
import { Favorites } from "@/app/routes/Favorites";
import { Upload } from "@/app/routes/Upload";
import { useUpload } from "@/app/queries/useUpload";
import { SignIn } from "@/app/routes/SignIn";
import { RequestAccess } from "@/app/routes/RequestAccess";
import { AccessRequestReview } from "@/app/routes/AccessRequestReview";
import { useDecideAccessRequest, usePendingAccessRequests, useSubmitAccessRequest } from "@/app/queries/useAccessRequests";
import {
  answerFailed,
  answerReceived,
  draftChanged,
  newChatStarted,
  retryRequested,
  sendStarted
} from "@/app/store/conversationSlice";
import type { RootState } from "@/app/store/store";

const SUGGESTED_PROMPTS = [
  "What does the archive cover?",
  "Show me recent newsletters",
  "Find trail maps",
  "What sections have published the most?"
];

function useDocumentViewer() {
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const documentQuery = useArchiveDocument(openDocumentId);
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const downloadDocument = useDownloadDocument();
  const toast = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isFavorited = favorites.data?.documents.some((doc) => doc.id === openDocumentId) ?? false;

  const modal =
    openDocumentId === null ? null : (
      <DocumentViewerModal
        document={documentQuery.isError ? null : documentQuery.data}
        onClose={() => setOpenDocumentId(null)}
        onDownload={(id) => {
          downloadDocument.mutate(id);
          toast.showToast("Downloading document");
        }}
        onToggleFavorite={(id) => {
          toggleFavorite.mutate({ archiveDocumentId: id, isFavorited });
          toast.showToast(isFavorited ? "Removed from favorites" : "Added to favorites");
        }}
        onAskAboutDocument={(id) => {
          const title = documentQuery.data?.title ?? id;
          dispatch(draftChanged(`Tell me more about "${title}".`));
          setOpenDocumentId(null);
          navigate("/");
        }}
        isFavorited={isFavorited}
      />
    );

  return { openDocument: setOpenDocumentId, modal };
}

function AskSearchContainer(): JSX.Element {
  const dispatch = useDispatch();
  const conversation = useSelector((state: RootState) => state.conversation);
  const ask = useAsk();
  const { openDocument, modal } = useDocumentViewer();

  function askQuestion(question: string): void {
    ask.mutate(question, {
      onSuccess: (result) => dispatch(answerReceived(result)),
      onError: () => dispatch(answerFailed())
    });
  }

  function handleSend(): void {
    if (conversation.draft.trim().length === 0 || conversation.thinking) {
      return;
    }
    const question = conversation.draft.trim();
    dispatch(sendStarted());
    askQuestion(question);
  }

  function handleRetry(): void {
    const lastUserMessage = [...conversation.messages].reverse().find((message) => message.role === "user");
    dispatch(retryRequested());
    if (lastUserMessage !== undefined) {
      askQuestion(lastUserMessage.text);
    }
  }

  return (
    <>
      <AskSearch
        messages={conversation.messages}
        draft={conversation.draft}
        thinking={conversation.thinking}
        suggestedPrompts={SUGGESTED_PROMPTS}
        error={conversation.messages[conversation.messages.length - 1]?.error}
        onDraftChange={(value) => dispatch(draftChanged(value))}
        onSend={handleSend}
        onNewChat={() => dispatch(newChatStarted())}
        onRetry={handleRetry}
        onOpenSource={openDocument}
      />
      {modal}
    </>
  );
}

function LibraryContainer(): JSX.Element {
  const { data } = useDocuments();
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const downloadDocument = useDownloadDocument();
  const toast = useToast();
  const { openDocument, modal } = useDocumentViewer();

  const favoritedIds = favorites.data?.documents.map((doc) => doc.id) ?? [];

  return (
    <>
      <Library
        documents={data?.documents ?? []}
        favoritedIds={favoritedIds}
        onView={openDocument}
        onDownload={(id) => {
          downloadDocument.mutate(id);
          toast.showToast("Downloading document");
        }}
        onToggleFavorite={(id) => {
          const isFavorited = favoritedIds.includes(id);
          toggleFavorite.mutate({ archiveDocumentId: id, isFavorited });
          toast.showToast(isFavorited ? "Removed from favorites" : "Added to favorites");
        }}
      />
      {modal}
    </>
  );
}

function FavoritesContainer(): JSX.Element {
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const downloadDocument = useDownloadDocument();
  const toast = useToast();
  const navigate = useNavigate();
  const { openDocument, modal } = useDocumentViewer();

  return (
    <>
      <Favorites
        documents={favorites.data?.documents ?? []}
        onView={openDocument}
        onDownload={(id) => {
          downloadDocument.mutate(id);
          toast.showToast("Downloading document");
        }}
        onUnfavorite={(id) => {
          toggleFavorite.mutate({ archiveDocumentId: id, isFavorited: true });
          toast.showToast("Removed from favorites");
        }}
        onGoToLibrary={() => navigate("/library")}
      />
      {modal}
    </>
  );
}

function RequirePublisher(props: { children: JSX.Element }): JSX.Element | null {
  const { data: user } = useSession();
  const navigate = useNavigate();
  const isBlocked = user !== undefined && user !== null && user.role !== "publisher";

  useEffect(() => {
    if (isBlocked) {
      navigate("/", { replace: true });
    }
  }, [isBlocked, navigate]);

  return isBlocked ? null : props.children;
}

function UploadContainer(): JSX.Element {
  const { data: user } = useSession();
  const { uploads, uploadFiles } = useUpload();
  const toast = useToast();
  const isPermitted = user?.role === "publisher";

  return (
    <Upload
      isPermitted={isPermitted}
      uploads={uploads}
      onFilesSelected={(files) => {
        uploadFiles(files);
        toast.showToast(files.length === 1 ? "Uploading 1 file" : `Uploading ${files.length} files`);
      }}
    />
  );
}

function SignInContainer(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <SignIn
      // ponytail: no real OAuth entry point exists yet — the browser never
      // holds Google credentials (FR-008), and feature 001 never built a
      // sign-in-initiation endpoint, only GET /api/session to check an
      // existing one. Re-checking the session here picks up a real session
      // once that backend redirect/token-exchange flow is added.
      onSignIn={() => void queryClient.invalidateQueries({ queryKey: ["session"] })}
      onGoToRequestAccess={() => navigate("/request-access")}
    />
  );
}

function RequestAccessContainer(): JSX.Element {
  const navigate = useNavigate();
  const submitAccessRequest = useSubmitAccessRequest();
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  return (
    <RequestAccess
      submitted={submittedName !== null}
      submittedName={submittedName ?? undefined}
      onSubmit={(submission) => {
        submitAccessRequest.mutate(submission, {
          onSuccess: () => setSubmittedName(submission.name.split(/\s+/)[0] ?? submission.name)
        });
      }}
      onBackToSignIn={() => {
        setSubmittedName(null);
        navigate("/");
      }}
    />
  );
}

function AccessRequestReviewContainer(): JSX.Element {
  const { data } = usePendingAccessRequests();
  const decide = useDecideAccessRequest();

  return (
    <AccessRequestReview
      requests={data?.requests ?? []}
      onApprove={(email) => decide.mutate({ email, decision: "approve" })}
      onDeny={(email) => decide.mutate({ email, decision: "deny" })}
    />
  );
}

export function AppRoutes(): JSX.Element {
  const { data: user, isLoading } = useSession();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div>Loading…</div>;
  }

  if (user === null || user === undefined) {
    return (
      <Routes>
        <Route path="/request-access" element={<RequestAccessContainer />} />
        <Route path="*" element={<SignInContainer />} />
      </Routes>
    );
  }

  return (
    <ToastProvider>
      <div style={{ display: "flex" }}>
        <SideNav user={user} onSignOut={() => queryClient.clear()} />
        <Routes>
          <Route path="/" element={<AskSearchContainer />} />
          <Route path="/library" element={<LibraryContainer />} />
          <Route path="/favorites" element={<FavoritesContainer />} />
          <Route
            path="/upload"
            element={
              <RequirePublisher>
                <UploadContainer />
              </RequirePublisher>
            }
          />
          <Route
            path="/access-requests"
            element={
              <RequirePublisher>
                <AccessRequestReviewContainer />
              </RequirePublisher>
            }
          />
        </Routes>
      </div>
    </ToastProvider>
  );
}
