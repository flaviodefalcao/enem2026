const svg = `
<svg width="1200" height="1500" viewBox="0 0 1200 1500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="1500" rx="48" fill="#F9F4EB"/>
  <rect x="72" y="80" width="400" height="34" rx="17" fill="#E2B95B" fill-opacity="0.24"/>
  <rect x="72" y="150" width="740" height="28" rx="14" fill="#C9D9EA"/>
  <rect x="72" y="196" width="864" height="28" rx="14" fill="#C9D9EA"/>
  <rect x="72" y="242" width="802" height="28" rx="14" fill="#C9D9EA"/>
  <rect x="72" y="340" width="1056" height="460" rx="32" fill="#FFFFFF"/>
  <path d="M164 696C226 520 354 520 414 628C474 736 594 736 654 580C714 424 878 430 962 696" stroke="#D96C3F" stroke-width="24" stroke-linecap="round"/>
  <circle cx="414" cy="628" r="18" fill="#102033"/>
  <circle cx="654" cy="580" r="18" fill="#102033"/>
  <rect x="72" y="854" width="1056" height="74" rx="24" fill="#FFFFFF"/>
  <rect x="72" y="958" width="1056" height="74" rx="24" fill="#FFFFFF"/>
  <rect x="72" y="1062" width="1056" height="74" rx="24" fill="#FFFFFF"/>
  <rect x="72" y="1166" width="1056" height="74" rx="24" fill="#FFFFFF"/>
  <rect x="72" y="1270" width="1056" height="74" rx="24" fill="#FFFFFF"/>
  <text x="72" y="1426" fill="#7B8CA2" font-size="38" font-family="Avenir Next, Segoe UI, sans-serif">
    Placeholder da questão original — trocar por imagem real do enunciado.
  </text>
</svg>
`;

export async function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
