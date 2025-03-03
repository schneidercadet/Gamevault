export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="game-modal__loading">
        <h3 className="text-white text-lg font-medium">Loading...</h3>
        <div className="w-full max-w-md">
          <div className="progress-bar">
            <div className="progress-bar__fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
