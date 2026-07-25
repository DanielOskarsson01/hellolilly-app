# D19 Adversarial Review Findings - CV-byggaren build brief

While the architectural strictness and the "fabrication invariant" are highly commendable on paper, the brief relies on circular logic at the export gate, makes impossible demands of natural language processing, and contains a fatal flaw in its data migration strategy that instantly breaks the core product promise for returning users.

---

### Axis 6 - Legacy laundering via default-to-verified
*   **Severity:** BLOCKER
*   **The concrete case:** The brief specifies that "Legacy facts with no status read as `verified` (defaulted at the single accessor)." Daniel (or any existing user later) has an old CV in the system that was processed by the *old* AI, which we already established invents facts (e.g., hallucinating a skill or an adjective). Because this legacy fact lacks a `status` field, the new accessor defaults it to `verified`. It completely bypasses the Slice 3 review UI ("Pre-truth gate") and is immediately injected into the summary generator and the final CV. You have just laundered a historical AI fabrication into a "guaranteed safe" document.
*   **What would resolve it:** Change the single accessor to default missing statuses to `unverified`. All legacy data must be forced through the Slice 3 review UI for explicit user confirmation before entering the new generation pipelines. 

### Axis 1 - The literal-token checker guarantees UI fatigue and rubber-stamping
*   **Severity:** MAJOR
*   **The concrete case:** The bullet composer contract states: "The paired checker flags any word or number not present in the inputs". In Swedish, turning the inputs `"Kassa"`, `"Varje helg"`, and `"Nöjda kunder"` into a readable sentence yields: *"Arbetade i kassan varje helg och såg till att vi fick nöjda kunder."* Words like *"Arbetade"*, *"i"*, *"och"*, *"såg till att"*, and *"vi fick"* are not in the inputs. Under the literal strictness of the brief, the checker will highlight half the sentence in yellow as a "claim diff." The user is faced with a wall of false positives simply because the AI used grammar. They will quickly learn to click "Ja, så var det" without reading, completely destroying the "user vouched for it" boundary. If the user is just rubber-stamping grammar, the AI can easily smuggle a real claim (*"Arbetade som ansvarig i kassan..."*) under the noise.
*   **What would resolve it:** Redefine the checker's contract. It cannot be a literal token-matcher. It must use an LLM-as-a-judge to check for *semantic claim additions* (new entities, numbers, seniority). Consequently, this moves the checker from an INVARIANT (deterministic) to a DISCIPLINE (judged).

### Axis 1 - Summary aggregation fabricating tenure/seniority
*   **Severity:** MAJOR
*   **The concrete case:** The summary writer claims to generate sentences linked only to supporting facts. Fact A is "Projektledare, 2019." Fact B is "Projektledare, 2023." The summary writer aggregates this to make the text flow better: *"Erfaren projektledare med fem års erfarenhet (2019-2023)."* The AI has fabricated a continuous five-year tenure out of two isolated dates. Every individual word can technically be "traced" back to a fact, but the aggregated mathematical claim is an invention.
*   **What would resolve it:** The summary writer's prompt must explicitly forbid temporal or quantitative aggregation across distinct facts. Alternatively, the eval corpus (Slice 2/3) must include "temporal gap" temptation cases to ensure the summary fails if it attempts to bridge dates.

### Axis 4 - Context-dropping inversion during extraction
*   **Severity:** MAJOR
*   **The concrete case:** The fact extraction contract mandates "verbatim spans, no paraphrase of hard facts." An uploaded CV has a section titled "Arbetsuppgifter jag absolut vill undvika:" and a bullet underneath reading "Lagermedarbetare, natt". The extractor dutifully extracts the verbatim span "Lagermedarbetare, natt" and presents it in the Step 3 review UI. The user, skimming, sees a familiar word they know is in their CV and clicks "Stämmer." A negation has been inverted into an experience claim because the structural context was dropped. 
*   **What would resolve it:** The "structural-risk detection" in Slice 3 must be expanded beyond overlapping dates/OCR damage to explicitly include hierarchical context mapping (e.g., extracting the parent header). 

### Axis 5 - The export gate is a redundant illusion
*   **Severity:** MINOR (but conceptually breaking)
*   **The concrete case:** The brief claims the export gate is the "fabrication invariant made deterministic" and blocks export if unconfirmed claims remain. But Slice 1 strictly enforces that "provisional facts are excluded from generation and from the CV until confirmed." If unverified facts are structurally prevented from entering the document model, the export gate scanning that same document model will *always* pass. It does not "block by construction"; it's a redundant check scanning for a state that previous slices made impossible. The danger here is false confidence: if an AI hallucination *did* slip past the checker in Slice 2 and the user clicked "Ja" (minting it as a verified fact), the export gate will let it through because it only checks the ledger's `verified` flag, not the truth of the text.
*   **What would resolve it:** Stop calling the export gate an INVARIANT. Acknowledge that the true load-bearing walls are the Slice 1 ledger filter and the Slice 2/3 user-confirmation rituals. 

---

**Conclusion**

This brief is **not yet fit to build**. While the architectural isolation of the ledger is excellent, the brief currently sabotages its own safety invariant through a lethal oversight in legacy data handling. The single most important thing to change before a single line of code is written is the **legacy default-to-verified rule (Axis 6)**; without reversing this, you will instantly pollute the clean ledger with historical AI hallucinations the moment an existing user logs in, rendering the entire elaborate verification machinery useless. Fix the legacy default, adjust the checker from a literal token-matcher to a semantic judge, and the brief will be ready for Slice 0.