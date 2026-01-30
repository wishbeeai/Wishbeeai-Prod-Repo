export default function WishlistLoading() {
  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#F5F1E8",
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(218, 165, 32, 0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-6 py-24">
          <div className="w-14 h-14 rounded-full border-4 border-[#DAA520]/30 border-t-[#DAA520] animate-spin" />
          <p className="text-lg font-semibold text-[#8B4513]">Loading wishlist...</p>
        </div>
      </div>
    </main>
  )
}
