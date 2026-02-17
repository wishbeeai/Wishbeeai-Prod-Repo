"use client"

export function Steps() {
  return (
    <section
      id="how-it-works"
      className="relative bg-gradient-to-b from-[#FFFDF7] via-[#FFF8EE] to-[#FFF5E6] pt-8 sm:pt-10 md:pt-12 lg:pt-14 pb-12 sm:pb-14 md:pb-16 lg:pb-20 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#DAA520] to-transparent shadow-lg"></div>

      {/* Animated falling water drops */}
      <div
        className="absolute top-10 left-[10%] w-3 h-4 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-70"
        style={{ animationDuration: "2s", animationDelay: "0s" }}
      ></div>
      <div
        className="absolute top-20 left-[25%] w-2.5 h-3.5 bg-gradient-to-b from-[#F4C430] to-[#DAA520] rounded-full animate-bounce opacity-60"
        style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute top-16 left-[40%] w-2 h-3 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-50"
        style={{ animationDuration: "3s", animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-12 left-[55%] w-3 h-4 bg-gradient-to-b from-[#DAA520] to-[#B8860B] rounded-full animate-bounce opacity-65"
        style={{ animationDuration: "2.2s", animationDelay: "0.3s" }}
      ></div>
      <div
        className="absolute top-24 left-[70%] w-2.5 h-3.5 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-55"
        style={{ animationDuration: "2.8s", animationDelay: "0.8s" }}
      ></div>
      <div
        className="absolute top-14 left-[85%] w-2 h-3 bg-gradient-to-b from-[#F4C430] to-[#DAA520] rounded-full animate-bounce opacity-70"
        style={{ animationDuration: "2.4s", animationDelay: "1.2s" }}
      ></div>

      <div
        className="absolute top-[20%] right-[15%] w-3 h-4 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-60"
        style={{ animationDuration: "2.6s", animationDelay: "0.4s" }}
      ></div>
      <div
        className="absolute top-[35%] right-[8%] w-2.5 h-3.5 bg-gradient-to-b from-[#DAA520] to-[#B8860B] rounded-full animate-bounce opacity-55"
        style={{ animationDuration: "2.9s", animationDelay: "1.1s" }}
      ></div>

      <div
        className="absolute bottom-[25%] left-[12%] w-2 h-3 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-65"
        style={{ animationDuration: "2.3s", animationDelay: "0.6s" }}
      ></div>
      <div
        className="absolute bottom-[15%] left-[30%] w-3 h-4 bg-gradient-to-b from-[#F4C430] to-[#DAA520] rounded-full animate-bounce opacity-70"
        style={{ animationDuration: "2.7s", animationDelay: "0.9s" }}
      ></div>
      <div
        className="absolute bottom-[20%] right-[22%] w-2.5 h-3.5 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-60"
        style={{ animationDuration: "2.5s", animationDelay: "1.3s" }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Heading */}
          <div className="text-center mb-2 sm:mb-3">
            <h2
              className="font-bold text-[#8B4513] mb-0 inline-flex items-center justify-center gap-2 font-[family-name:var(--font-shadows)]"
              style={{ width: 370.53, height: 60, fontSize: '48px' }}
            >
              How it works
              <img
                src="/images/Honey_Bee_Trail.png"
                alt=""
                aria-hidden
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 object-contain shrink-0 mix-blend-darken animate-bounce mt-1 sm:mt-1.5"
                style={{ animationDuration: "2.5s" }}
              />
            </h2>
            {/* Decorative curved arrow - same as Why Choose Wishbee */}
            <div className="relative w-full min-h-[2rem] flex justify-center -mb-4">
              <svg
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-12 opacity-40"
                viewBox="0 0 200 50"
                fill="none"
              >
                <path
                  d="M10 25 Q 100 10, 190 25"
                  stroke="#8B4513"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-center text-lg sm:text-xl md:text-2xl text-[#654321] mb-8 sm:mb-10 px-4 max-w-4xl mx-auto leading-relaxed font-[family-name:var(--font-shadows)]">
            Turn a Gift Idea into Celebration in Just Minutes with Our Fast Gift Platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-4">
                <div className="w-full max-w-full aspect-[4/3] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/images/clipautotag-step1.png"
                    alt="Clip & Auto-Tag"
                    className="w-full h-full object-cover object-[center_40%] brightness-95"
                  />
                </div>
              </div>

              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#8B4513] tracking-wide mb-2 font-sans">
                1. Clip & Auto-Tag
              </h3>

              <div className="md:h-20 lg:h-24 flex items-center">
                <p className="text-[0.7rem] sm:text-xs md:text-base text-[#8B4513]/80 leading-relaxed font-light max-w-xl text-balance font-sans">
                  Clip and auto-tag gift ideas instantly from any online store or universal wishlist with one click.
                </p>
              </div>
            </div>

            {/* Step 2 - Share & Fund */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-4">
                <div className="w-full max-w-full aspect-[4/3] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-lg overflow-hidden shadow-lg relative">
                  <img src="/images/steps2-final.png" alt="Share & Fund" className="w-full h-full object-cover" />
                  <img
                    src="/images/share-fund-icon.png"
                    alt=""
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 object-contain drop-shadow-xl mix-blend-multiply brightness-90 contrast-125"
                  />
                </div>
              </div>

              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#8B4513] tracking-wide mb-2 font-sans">
                2. Share & Fund
              </h3>

              <div className="md:h-20 lg:h-24 flex items-center">
                <p className="text-[0.7rem] sm:text-xs md:text-base text-[#8B4513]/80 leading-relaxed font-light max-w-xl text-balance font-sans">
                  Share Your Group Gift with Friends and Easily Collect Funds or Contributions for the Shared Gift.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-4">
                <div className="w-full max-w-full aspect-[4/3] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-lg overflow-hidden shadow-lg">
                  <img src="/images/step3-final.png" alt="Buy & Celebrate" className="w-full h-full object-cover object-[center_80%] brightness-95" />
                </div>
              </div>

              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#8B4513] tracking-wide mb-2 font-sans">
                3. Buy & Celebrate
              </h3>

              <div className="md:h-20 lg:h-24 flex items-center">
                <p className="text-[0.7rem] sm:text-xs md:text-base text-[#8B4513]/80 leading-relaxed font-light max-w-xl text-balance font-sans">
                  Secure Checkout to Buy the Perfect Surprise Gift and Celebrate Hassle-Free Gifting.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-4">
                <div className="w-full max-w-full aspect-[4/3] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-lg overflow-hidden shadow-lg relative">
                  <img
                    src="/images/step4-settle.png"
                    alt="Purchase & Settle"
                    className="w-full h-full object-cover"
                  />
                  <img
                    src="/images/step4-settle-icon.png"
                    alt=""
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain drop-shadow-md mix-blend-multiply"
                  />
                </div>
              </div>

              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#8B4513] tracking-wide mb-2 font-sans">
                4. Settle Balance
              </h3>

              <div className="md:h-20 lg:h-24 flex items-center">
                <p className="text-[0.7rem] sm:text-xs md:text-base text-[#8B4513]/80 leading-relaxed font-light max-w-xl text-balance font-sans">
                  Buy your gift and easily settle the remaining balance your way—via rewards, donations, or credits.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative bottom accent */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent rounded-full"></div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#DAA520] to-transparent shadow-lg"></div>
    </section>
  )
}
