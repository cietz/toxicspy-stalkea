(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [239],
  {
    5392: (e, a, s) => {
      "use strict";
      (s.r(a), s.d(a, { default: () => d }));
      var i = s(5155),
        o = s(2115),
        t = s(5176),
        r = s(8111);
      let n = [
          {
            q: "\u00bfTengo que hacer otro pago?",
            a: "Esta tarifa es independiente de la compra inicial. Sirve exclusivamente para activar los servidores encriptados, garantizar el modo invisible y liberar las copias de seguridad autom\u00e1ticas con total secreto.",
          },
          {
            q: "\u00bfAparece el nombre de la app en el cargo?",
            a: "No. El cargo aparece con un nombre discreto y gen\u00e9rico para proteger tu privacidad.",
          },
          {
            q: "\u00bfEsta tarifa es realmente obligatoria?",
            a: "S\u00ed. Sin ella, el sistema no puede activar los protocolos de seguridad y privacidad, lo que compromete todo el funcionamiento.",
          },
          {
            q: "\u00bfPuedo usar la app sin activar el firewall?",
            a: "No. La activaci\u00f3n del firewall es necesaria para liberar el acceso completo y garantizar el secreto de las operaciones.",
          },
        ],
        l = [
          "Protecci\u00f3n total de tus datos e identidad",
          "100% de secreto en la investigaci\u00f3n",
          "Liberaci\u00f3n de copias de seguridad autom\u00e1ticas",
          "Firewall activo por 1 a\u00f1o despu\u00e9s del pago",
        ];
      function d() {
        let [e, a] = (0, o.useState)(!1),
          [s, d] = (0, o.useState)(!1),
          [c, m] = (0, o.useState)(!1),
          [p, u] = (0, o.useState)(!1);
        return (
          (0, o.useEffect)(() => {
            window.history.pushState(null, "", window.location.href);
            let e = () => {
              window.history.pushState(null, "", window.location.href);
            };
            return (
              window.addEventListener("popstate", e),
              () => {
                window.removeEventListener("popstate", e);
              }
            );
          }, []),
          (0, i.jsxs)(i.Fragment, {
            children: [
              (0, i.jsx)(t.K7, {}),
              (0, i.jsx)(t.$z, {
                line1: "Aten\xe7\xe3o, n\xe3o saia dessa p\xe1gina!",
                line2: "Sua compra ainda n\xe3o foi 100% conclu\xedda",
              }),
              (0, i.jsx)("main", {
                className: "min-h-screen px-4 py-8",
                style: { paddingTop: "calc(60px + 1.5rem)" },
                children: (0, i.jsxs)("div", {
                  className: "container-dpgm animate-fadeIn",
                  children: [
                    (0, i.jsx)(t.gu, {}),
                    (0, i.jsx)("div", {
                      style: {
                        width: "90%",
                        maxWidth: "400px",
                        height: "12px",
                        background: "rgba(255, 255, 255, 0.08)",
                        borderRadius: "999px",
                        overflow: "hidden",
                        margin: "0 auto clamp(20px, 5vw, 28px) auto",
                      },
                      children: (0, i.jsx)("div", {
                        style: {
                          height: "100%",
                          background:
                            "linear-gradient(135deg, #4a37b6 0%, #ab58f4 100%)",
                          borderRadius: "999px",
                          width: "33%",
                        },
                      }),
                    }),
                    (0, i.jsxs)(t.Zp, {
                      className: "mb-lg",
                      children: [
                        (0, i.jsxs)("div", {
                          className: "text-center mb-lg",
                          children: [
                            (0, i.jsx)(t.X9, {}),
                            (0, i.jsx)(t.iv, {
                              delay: 900,
                              onComplete: () => a(!0),
                            }),
                          ],
                        }),
                        e &&
                          (0, i.jsxs)("div", {
                            className: "animate-fadeIn",
                            children: [
                              (0, i.jsxs)("p", {
                                className: "subtitle-dpgm mb-md text-center",
                                children: [
                                  "Para garantizar ",
                                  (0, i.jsx)("strong", {
                                    className: "text-white",
                                    children:
                                      "el total secreto de tu identidad",
                                  }),
                                  ", es necesario realizar un pago \u00fanico de una peque\u00f1a tarifa de",
                                  " ",
                                  (0, i.jsx)("strong", {
                                    className: "text-gradient",
                                    children: "Firewall y Secreto",
                                  }),
                                  ".",
                                ],
                              }),
                              (0, i.jsx)("div", {
                                className: "alert-dpgm alert-warning",
                                children: (0, i.jsxs)("span", {
                                  children: [
                                    (0, i.jsx)("strong", {
                                      children:
                                        "\u26a0\ufe0f Activaci\u00f3n obligatoria:",
                                    }),
                                    " sin esta tarifa, Instagram puede notificar a tu c\u00f3nyuge que est\u00e1 siendo monitoreado y exponer tu identidad por medidas de seguridad.",
                                  ],
                                }),
                              }),
                            ],
                          }),
                      ],
                    }),
                    e &&
                      (0, i.jsx)(t.s1, { delay: 300, onComplete: () => d(!0) }),
                    s &&
                      (0, i.jsxs)("div", {
                        className: "animate-fadeIn",
                        children: [
                          (0, i.jsxs)(t.Zp, {
                            highlight: !0,
                            className: "mb-lg",
                            style: {
                              position: "relative",
                              overflow: "visible",
                            },
                            children: [
                              (0, i.jsx)("div", {
                                className:
                                  "badge-dpgm badge-primary absolute -top-3 right-4",
                                children: "Limitado",
                              }),
                              (0, i.jsxs)("h2", {
                                className:
                                  "text-xl font-bold mb-lg text-center",
                                children: [
                                  (0, i.jsx)("span", {
                                    className: "text-gradient",
                                    children: "Oferta Especial",
                                  }),
                                  " ",
                                  (0, i.jsx)("span", {
                                    className: "fire-emoji",
                                    children: "\uD83D\uDD25",
                                  }),
                                ],
                              }),
                              (0, i.jsx)(t.T5, { items: l }),
                              (0, i.jsx)(t.kb, {
                                originalPrice: "R$69,90",
                                currentPrice: "R$37,00",
                                discount: "R$32 OFF",
                                onClick: () =>
                                  (0, r.m)("https://www.google.com"),
                              }),
                              (0, i.jsx)(t.$n, {
                                href: "https://www.google.com",
                                pulse: !0,
                                subtitle: "Y acceder al instagram ahora mismo",
                                style: { letterSpacing: "-0.5px" },
                                children:
                                  "\uD83D\uDD10 Proteger mis datos y secreto",
                              }),
                            ],
                          }),
                          (0, i.jsx)(t.Tw, { items: n, variant: "new" }),
                          (0, i.jsx)(t.wi, {
                            showLogo: !0,
                            showLinks: !0,
                            onTermsClick: () => m(!0),
                            onPrivacyClick: () => u(!0),
                          }),
                        ],
                      }),
                  ],
                }),
              }),
              c && (0, i.jsx)(t.Wb, { onClose: () => m(!1) }),
              p && (0, i.jsx)(t.Ke, { onClose: () => u(!1) }),
            ],
          })
        );
      }
    },
    7573: (e, a, s) => {
      Promise.resolve().then(s.bind(s, 5392));
    },
  },
  (e) => {
    (e.O(0, [176, 441, 255, 358], () => e((e.s = 7573))), (_N_E = e.O()));
  },
]);
