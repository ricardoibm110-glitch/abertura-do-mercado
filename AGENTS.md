<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep auction calculations in pure functions with tests; displayed pressure is an indicative signal, not a calibrated prediction.
- Public home contains only a labeled simulation; signed-in pages use the managed client-only gate and server-validated access approval.
- Store roles separately from access requests; administrator assignment is manual to avoid first-signup privilege escalation.
- Auth identity transitions have one root subscriber; sign-out cancels and clears private query caches.
