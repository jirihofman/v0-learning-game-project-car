type ArtProps = { className?: string }

function CarBody() {
  return (
    <>
      <ellipse cx="40" cy="66" rx="25" ry="7" fill="#223d36" opacity=".12" />
      <rect x="15" y="21" width="10" height="17" rx="4" fill="#223d36" />
      <rect x="55" y="21" width="10" height="17" rx="4" fill="#223d36" />
      <rect x="15" y="48" width="10" height="17" rx="4" fill="#223d36" />
      <rect x="55" y="48" width="10" height="17" rx="4" fill="#223d36" />
      <rect x="22" y="9" width="36" height="61" rx="12" fill="#c96f4c" />
      <rect x="22" y="7" width="36" height="58" rx="11" fill="#ec966d" />
      <path d="M28 16c0-3 2-5 5-5h14c3 0 5 2 5 5v9H28Z" fill="#f4ae86" />
      <rect x="25" y="10" width="8" height="5" rx="2.5" fill="#fff2bf" />
      <rect x="47" y="10" width="8" height="5" rx="2.5" fill="#fff2bf" />
      <path d="M29 29h22l3 11H26Z" fill="#257b68" />
      <path d="M31 31h8l-5 7h-5Z" fill="#b4e0cb" />
      <path d="M28 45h24v10H28Z" fill="#f4b28b" />
      <path
        d="M30 48h20"
        stroke="#ffd0ab"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="18" y="33" width="6" height="6" rx="2" fill="#f4ae86" />
      <rect x="56" y="33" width="6" height="6" rx="2" fill="#f4ae86" />
      <rect x="29" y="58" width="22" height="12" rx="5" fill="#223d36" />
      <rect x="34" y="61" width="12" height="6" rx="3" fill="#5c7161" />
    </>
  )
}

function TreeBody() {
  return (
    <>
      <ellipse cx="40" cy="68" rx="23" ry="7" fill="#223d36" opacity=".1" />
      <rect x="36" y="43" width="8" height="26" rx="3" fill="#ba8763" />
      <path d="m40 10 24 39c3 4 0 8-4 8H20c-4 0-7-4-4-8Z" fill="#257b68" />
      <path d="m40 8 18 29c2 4 0 7-4 7H26c-4 0-6-3-4-7Z" fill="#4f9677" />
      <path d="M40 8v36H26c-4 0-6-3-4-7Z" fill="#68a589" />
      <path d="M40 45v12H20c-4 0-7-4-4-8l9-14 1 9h14Z" fill="#35866e" />
    </>
  )
}

export function CarArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <CarBody />
    </svg>
  )
}

export function TreeArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <TreeBody />
    </svg>
  )
}

export function RockArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="41" cy="62" rx="28" ry="7" fill="#223d36" opacity=".1" />
      <path d="m15 51 10-25 24-7 16 18 3 20-14 8H27Z" fill="#9eafa1" />
      <path d="m25 26 24-7-7 27-27 5Z" fill="#c0cab7" />
      <path d="m49 19 16 18-23 9Z" fill="#d2d8c8" />
      <path d="m42 46 23-9 3 20-14 8Z" fill="#8b9f92" />
      <path
        d="m25 26 11 5"
        stroke="#e3e7db"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m11 65 3-6 3 6m48 3 3-7 3 7"
        stroke="#88a677"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FlagArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="39" cy="66" rx="23" ry="7" fill="#257b68" opacity=".12" />
      <path
        d="M29 14v51"
        stroke="#526b54"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M32 15h28a3 3 0 0 1 2 5l-8 9 8 9a3 3 0 0 1-2 5H32Z"
        fill="#ecc664"
      />
      <path
        d="M32 15h13v14H32Zm13 14h13l4 9a3 3 0 0 1-2 5H45Z"
        fill="#f9e4a6"
      />
      <circle cx="29" cy="12" r="4" fill="#ecc664" />
      <path
        d="M21 66h16"
        stroke="#526b54"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FruitArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="40" cy="68" rx="22" ry="5" fill="#223d36" opacity=".1" />
      <path
        d="M40 29c-2-6-2-12 2-17"
        stroke="#805e46"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M42 22c0-11 9-16 19-14-2 11-9 15-19 14Z" fill="#4f9677" />
      <path
        d="M40 29c-19-13-33 3-26 22 5 15 16 19 26 14 10 5 21 1 26-14 7-19-7-35-26-22Z"
        fill="#e98560"
      />
      <path
        d="M40 29c-19-13-33 3-26 22 4 12 12 17 21 16-10-10-14-27 5-38Z"
        fill="#f3aa7c"
      />
      <path
        d="M23 37c-3 3-4 7-3 11"
        stroke="#ffdab7"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M37 31c2 1 4 1 6 0"
        stroke="#c97550"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function GemArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="40" cy="69" rx="22" ry="5" fill="#223d36" opacity=".1" />
      <path d="m25 19-13 18 28 30 28-30-13-18Z" fill="#57af9b" />
      <path d="m25 19-13 18h18Z" fill="#a7ddc2" />
      <path d="m25 19 5 18 10-18Z" fill="#78c8ad" />
      <path d="m40 19-10 18h20Z" fill="#c9ecd8" />
      <path d="m40 19 10 18 5-18Z" fill="#9ad6b9" />
      <path d="m55 19-5 18h18Z" fill="#68b49a" />
      <path d="M12 37h18l10 30Z" fill="#3c9e89" />
      <path d="M30 37h20L40 67Z" fill="#70c4a9" />
      <path d="M50 37h18L40 67Z" fill="#257b68" />
      <path
        d="M64 8v8m-4-4h8M11 54v6m-3-3h6"
        stroke="#ecc664"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AdventureArt({ className }: ArtProps) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 520 220"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="415" cy="47" r="23" fill="#ecc664" />
      <path
        d="M98 49c0-10 9-15 17-11 3-15 25-15 29-1 11-4 21 4 21 12Z"
        fill="#fffdf5"
      />
      <path
        d="M294 31c0-7 6-11 12-8 3-12 19-12 22-1 8-3 16 3 16 9Z"
        fill="#fffdf5"
      />
      <path
        d="M0 150c39-36 63-66 115-63 42 3 64 39 92 29 33-12 36-57 89-53 45 3 62 39 96 35 49-7 93-26 128 19v103H0Z"
        fill="#c6dbb7"
      />
      <path
        d="M30 183C77 131 100 96 149 112c33 12 44 57 83 57 42 0 66-69 120-66 68 4 70 69 168 62v55H0Z"
        fill="#b0cda2"
      />
      <path
        d="M0 186c47-22 74-27 112-9 41 20 95 27 148 3 82-37 107-3 164-11 45-6 76-18 96-14v65H0Z"
        fill="#9bbd93"
      />
      <path
        d="M129 230c-1-36 78-18 97-51 22-38-80-31-44-62 23-21 106 3 126-13 14-11-3-28 33-30 16 0 30 2 42 0"
        stroke="#98b188"
        strokeWidth="42"
        strokeLinecap="round"
      />
      <path
        d="M129 226c-1-36 78-18 97-51 22-38-80-31-44-62 23-21 106 3 126-13 14-11-3-28 33-30 16 0 30 2 42 0"
        stroke="#f8efcf"
        strokeWidth="38"
        strokeLinecap="round"
      />
      <path
        d="M129 226c-1-36 78-18 97-51 22-38-80-31-44-62 23-21 106 3 126-13 14-11-3-28 33-30 16 0 30 2 42 0"
        stroke="#d5c495"
        strokeWidth="2.5"
        strokeDasharray="7 9"
        strokeLinecap="round"
      />
      <g transform="translate(69 90) scale(.92)">
        <TreeBody />
      </g>
      <g transform="translate(24 123) scale(.7)">
        <TreeBody />
      </g>
      <g transform="translate(393 100) scale(.9)">
        <TreeBody />
      </g>
      <g transform="translate(451 124) scale(.67)">
        <TreeBody />
      </g>
      <g transform="translate(247 26) scale(.63)">
        <TreeBody />
      </g>
      <g transform="translate(195 139) rotate(28 28 28) scale(.67)">
        <CarBody />
      </g>
      <g transform="translate(370 31)">
        <path
          d="M0 4v39"
          stroke="#526b54"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path d="M2 5h26l-7 9 7 9H2Z" fill="#ec966d" />
        <path
          d="m11 10 3 3 6-6"
          stroke="#fff4d9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cy="3" r="3" fill="#ecc664" />
      </g>
      <path
        d="m64 189 3-7 3 7m281-35 3-7 3 7m-39 39 3-7 3 7m102 7 3-7 3 7m-218-72 3-7 3 7"
        stroke="#799f75"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g fill="#f7e4a4">
        <circle cx="156" cy="157" r="3" />
        <circle cx="164" cy="168" r="2.5" />
        <circle cx="284" cy="185" r="3" />
        <circle cx="295" cy="181" r="2.5" />
        <circle cx="390" cy="167" r="3" />
        <circle cx="398" cy="175" r="2.5" />
        <circle cx="76" cy="182" r="2.5" />
      </g>
      <path d="m353 186 6-9 12 1 6 11-9 4h-12Z" fill="#93a58e" />
      <path d="m359 177 12 1-5 8-13 0Z" fill="#c0cab7" />
      <path
        d="M232 55q5-6 10 0m0 0q5-6 10 0M182 40q4-5 8 0m0 0q4-5 8 0"
        stroke="#87a58a"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
