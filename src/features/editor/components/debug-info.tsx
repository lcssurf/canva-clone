interface DebugInfoProps {
  pageData: any;
  currentPageData: any;
  activePageId: string;
  editor: any;
  loadingPage: boolean;
}

export const DebugInfo = ({ pageData, currentPageData, activePageId, editor, loadingPage }: DebugInfoProps) => {
  if (process.env.NODE_ENV !== 'development') return null;

  const canvasObjects = editor?.canvas?.getObjects() || [];
  const workspace = canvasObjects.find(obj => obj.name === "clip");

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-y-auto">
      <div className="mb-2">
        <strong>🐛 Debug Info:</strong>
      </div>
      <div>📄 Active Page: {activePageId}</div>
      <div>📊 Page Data: {pageData ? '✅ Loaded' : '❌ Not loaded'}</div>
      <div>📊 Loading: {loadingPage ? '⏳ Loading...' : '✅ Ready'}</div>
      <div>🎨 Editor: {editor ? '✅ Initialized' : '❌ Not initialized'}</div>
      <div>📐 Canvas Size: {editor?.canvas?.getWidth()}x{editor?.canvas?.getHeight()}</div>
      <div>🎯 Canvas Objects: {canvasObjects.length}</div>
      <div>🖼️ Workspace: {workspace ? `${workspace.width}x${workspace.height}` : '❌ Missing'}</div>
      <div className="mt-2">
        <strong>Current Page Data:</strong>
        <pre className="text-xs bg-gray-800 p-2 rounded mt-1 max-h-32 overflow-y-auto">
          {JSON.stringify({
            width: currentPageData.width,
            height: currentPageData.height,
            hasState: !!currentPageData.fabricState,
            stateLength: currentPageData.fabricState?.length || 0
          }, null, 2)}
        </pre>
      </div>
      <div className="mt-2">
        <strong>Canvas Objects:</strong>
        <div className="text-xs bg-gray-800 p-2 rounded mt-1 max-h-32 overflow-y-auto">
          {canvasObjects.map((obj, idx) => (
            <div key={idx}>
              {idx + 1}. {obj.type} {obj.name ? `(${obj.name})` : ''} - {obj.left},{obj.top}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};