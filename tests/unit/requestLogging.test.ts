import { requestLogging } from "@/backend/middleware/requestLogging";

function fakeReqRes(statusCode: number) {
  const listeners: Record<string, () => void> = {};
  const req = { method: "GET", path: "/api/documents" };
  const res = {
    statusCode,
    setHeader: jest.fn(),
    on: (event: string, handler: () => void) => {
      listeners[event] = handler;
    },
    emitFinish: () => listeners.finish?.()
  };
  return { req, res };
}

describe("requestLogging", () => {
  it("logs INFO for successful responses", () => {
    const writeSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    const { req, res } = fakeReqRes(200);
    requestLogging()(req as never, res as never, jest.fn());
    res.emitFinish();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("\"severity\":\"INFO\""));
    writeSpy.mockRestore();
  });

  it("logs ERROR for 5xx responses", () => {
    const writeSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    const { req, res } = fakeReqRes(500);
    requestLogging()(req as never, res as never, jest.fn());
    res.emitFinish();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("\"severity\":\"ERROR\""));
    writeSpy.mockRestore();
  });
});
