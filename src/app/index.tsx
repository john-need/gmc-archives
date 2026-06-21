import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { store } from "@/app/store/store";
import { queryClient } from "@/app/queries/queryClient";
import { AppRoutes } from "@/app/routes";

export function App(): JSX.Element {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </QueryClientProvider>
    </Provider>
  );
}
