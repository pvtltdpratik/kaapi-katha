"use client";

import { forwardRef } from "react";

/**
 * A layered SVG puppy. Every part that moves is its own group, so the motion is
 * part-specific (tail wags from its root, ears swing from their tops, eyelids
 * close, the head tilts) instead of rotating one flat picture.
 *
 * State is expressed through data attributes on the root; all the actual motion
 * lives in the `.pup-*` rules in globals.css. The parent drives:
 *   data-mood   "idle" | "happy"
 *   data-alert  "true" when the cursor is close (ears lift)
 *   data-blink  "true" for a moment (eyelids closed)
 *   data-tilt   "left" | "right" | "none"
 * and moves `.pup-eyes` directly for cursor-following.
 */
const Puppy = forwardRef<SVGSVGElement, { className?: string }>(function Puppy(
  { className },
  ref
) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      className={`pup ${className ?? ""}`}
      data-mood="idle"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="pup-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ebb872" />
          <stop offset="1" stopColor="#d9a15b" />
        </linearGradient>
        <linearGradient id="pup-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d49a50" />
          <stop offset="1" stopColor="#b97d3a" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="190" rx="52" ry="7" fill="rgba(60,40,20,0.18)" />

      <g className="pup-body-wrap">
        {/* tail: behind the body, wags from its root */}
        <g className="pup-tail">
          <path
            d="M138 176 C160 172 176 150 172 122 C170 112 180 110 184 120 C192 144 176 184 146 190 Z"
            fill="url(#pup-fur)"
          />
          <path d="M172 122 C170 112 180 110 184 120 C185 126 184 130 183 134 C178 128 174 126 172 122 Z" fill="#f6e3c3" />
        </g>

        {/* body + chest breathe together */}
        <g className="pup-breathe">
          <path
            d="M58 192 C44 150 60 118 100 116 C140 118 156 150 142 192 Z"
            fill="url(#pup-fur)"
          />
          <path d="M82 192 C76 160 88 130 100 128 C112 130 124 160 118 192 Z" fill="#f6e3c3" />
          {/* front paws */}
          <ellipse cx="82" cy="190" rx="14" ry="8" fill="#f6e3c3" />
          <ellipse cx="118" cy="190" rx="14" ry="8" fill="#f6e3c3" />
          <path d="M76 190v-4M82 191v-5M88 190v-4M112 190v-4M118 191v-5M124 190v-4" stroke="#c99a5c" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* head: tilts as one piece, ears and eyes move inside it */}
        <g className="pup-head">
          <g className="pup-ear pup-ear-l">
            <path d="M58 60 C36 66 28 100 42 122 C56 118 66 94 70 70 Z" fill="url(#pup-ear)" />
          </g>
          <g className="pup-ear pup-ear-r">
            <path d="M142 60 C164 66 172 100 158 122 C144 118 134 94 130 70 Z" fill="url(#pup-ear)" />
          </g>

          <path
            d="M100 34 C140 32 162 62 158 94 C154 124 130 140 100 140 C70 140 46 124 42 94 C38 62 60 32 100 34 Z"
            fill="url(#pup-fur)"
          />
          {/* fluffy forehead curls */}
          <path d="M84 44 q6 -8 13 -2 M98 40 q7 -8 14 -1 M112 44 q6 -7 12 0" fill="none" stroke="#c48a45" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="100" cy="110" rx="31" ry="25" fill="#f6e3c3" />

          {/* cheeks, only visible when happy */}
          <circle className="pup-blush" cx="66" cy="106" r="8" fill="#f4a3a3" />
          <circle className="pup-blush" cx="134" cy="106" r="8" fill="#f4a3a3" />

          {/* eyes: follow the cursor, close to blink, become arcs when happy */}
          <g className="pup-eyes">
            <g className="pup-eye-open">
              <g className="pup-lid">
                <ellipse cx="78" cy="88" rx="8.5" ry="10" fill="#3a2316" />
                <ellipse cx="122" cy="88" rx="8.5" ry="10" fill="#3a2316" />
                <circle cx="81" cy="84" r="3" fill="#fff" />
                <circle cx="125" cy="84" r="3" fill="#fff" />
                <circle cx="75.5" cy="92" r="1.4" fill="#fff" opacity=".8" />
                <circle cx="119.5" cy="92" r="1.4" fill="#fff" opacity=".8" />
              </g>
            </g>
          </g>
          <g className="pup-eye-happy">
            <path d="M68 90 Q78 76 88 90" fill="none" stroke="#3a2316" strokeWidth="4" strokeLinecap="round" />
            <path d="M112 90 Q122 76 132 90" fill="none" stroke="#3a2316" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* soft brows give the idle face its gentle, curious look */}
          <path className="pup-brows" d="M68 70 Q78 64 88 68 M112 68 Q122 64 132 70" fill="none" stroke="#b97d3a" strokeWidth="2.6" strokeLinecap="round" />

          {/* nose and mouth */}
          <path d="M91 101 Q100 96 109 101 Q105 112 100 112 Q95 112 91 101 Z" fill="#3b2417" />
          <ellipse cx="97" cy="100" rx="3" ry="1.6" fill="#7a5a48" opacity=".7" />
          <path d="M100 112 v5" stroke="#3b2417" strokeWidth="2" strokeLinecap="round" />
          <path className="pup-smile" d="M90 118 Q100 124 110 118" fill="none" stroke="#3b2417" strokeWidth="2.4" strokeLinecap="round" />
          <g className="pup-mouth-open">
            <path d="M89 116 Q100 140 111 116 Q100 122 89 116 Z" fill="#7a2f2f" />
            <path d="M94 121 Q100 136 106 121 Q100 125 94 121 Z" fill="#f28fa0" />
          </g>
        </g>
      </g>
    </svg>
  );
});

export default Puppy;
