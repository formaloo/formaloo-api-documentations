Generates and returns a short-lived hosted URL that starts WhatsApp Embedded Signup for the workspace selected by `active_business`.

Provide both required query parameters: `next`, an absolute HTTP(S) return URL on a host allowed by Formaloo, and `phone_number`, the intended sender in E.164 format such as `+15017122661`. The response payload is under `data.whatsapp_redirect.redirect_url`.

Open the short-lived signed URL interactively in a browser with an authenticated workspace-administrator ICAS session and complete provider onboarding. Then retrieve the connection until its status becomes `active` or `error`; inspect `status_detail` when setup does not succeed. Receiving a URL does not itself mean the workspace is connected.
