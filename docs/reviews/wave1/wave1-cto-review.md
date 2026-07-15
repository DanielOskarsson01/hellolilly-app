# CTO Review: HelloLilly North Star & Walkthrough Findings

## Strategy Critique

**1. The Parity Standard: An Engineering Footgun**
The document demands that rebuilt tools produce "THE EXACT SAME OUTCOME as the original". As an acceptance regime for non-deterministic LLM pipelines, strict parity is a trap. You cannot enforce byte-for-byte or word-for-word parity across different model versions, context windows, or temperature settings. If engineering takes "exact same outcome" literally, they will spend weeks fighting the LLM to reproduce the exact phrasing of a legacy script rather than shipping features. Parity must be redefined as *semantic and structural parity*—meaning the JSON schema matches exactly, and the content passes an LLM-as-a-judge evaluation against the original output. 

**2. The "Replace, Do Not Repair" Doctrine: The Cost of Legacy Wiring**
The directive to use "proven engines" where they can be used ignores the architectural reality of what those engines are. The original CV builder consists of "two run-by-hand Node scripts". Wiring local CLI scripts into a modern web service introduces severe impedance mismatches. It forces synchronous, file-system-heavy operations (like generating .docx files) into a web pipeline, creating bottlenecks, blocking the event loop, and introducing deployment complexity. The doctrine is philosophically sound but structurally dangerous if it means deploying hacky CLI scripts as production microservices.

**3. The Advocacy Principle: Internally Consistent, Architecturally Fragile**
The pivot from auditing to advocacy ("warn, do not block") is a massive product upgrade. The logic that bold claims are safe because the interview prep tool will rehearse them is internally consistent. However, it is fundamentally unsafe in practice. It relies on the assumption that the user will complete the entire "happy path." If a user uses the Tailor to push a bold framing, downloads the CV, applies, and *skips* the interview prep tool, HelloLilly has just sent an under-prepared candidate to an employer with an embellished CV. If HelloLilly's long-term moat is B2B trust with municipalities and employers, this broken safety net risks the platform's reputation. 

**4. The Two-Tools CV Split: The Missing Data Contract**
Splitting the CV into a structural Builder (job-agnostic) and a content Tailor (job-bound) solves the immediate conflation bug. However, the document dramatically underprices the integration pain of the handoff interface. The Tailor is supposed to operate within a "locked template". If the Builder passes a finalized `.docx` to the Tailor, the Tailor cannot reliably parse, inject content, and re-render that `.docx` without corrupting the file or losing styling. Document generation is highly brittle. 

---

## The Three Biggest Risks

### Risk 1: The DocX Handoff (Boundary Failure)
* **The Failure:** The Builder generates a template format (like DOCX) that the Tailor cannot cleanly manipulate, resulting in corrupted files, lost CSS/styling, or the Tailor falling back to injecting arbitrary structure, recreating the exact bug this document attempts to solve.
* **The Mitigation:** Establish a strict, intermediate JSON Abstract Syntax Tree (AST) as the system's lingua franca for CVs. Neither the Builder nor the Tailor should touch a `.docx` file. The Builder outputs an AST. The Tailor modifies the text nodes of that AST. A completely separate rendering service takes the final AST and generates the DOCX.

### Risk 2: The "Broken Safety Net" (Advocacy without Prep)
* **The Failure:** Users generate highly aggressive CVs using the Tailor, bypass the interview prep modules, bomb their interviews, and destroy HelloLilly's reputation as a reliable matching service provider.
* **The Mitigation:** State-sharing must be bi-directional, and the UI must enforce awareness. When the Tailor generates a bold "bridged" claim, it must tag that datafact as `high-risk`. The UI must explicitly warn the user during the CV download step: *"You have 3 bold claims in this CV. You MUST run the Interview Prep module to defend them."*

### Risk 3: Non-Deterministic CI/CD Gridlock
* **The Failure:** QA or automated tests constantly fail because the new architecture produces output that is 5% different from the old Node scripts, violating the "exact same outcome" standard.
* **The Mitigation:** Formally amend Section 3 ("The standard: outcome parity"). Redefine it as: *"The rebuilt version must achieve 100% structural parity (matching data schemas) and pass semantic evaluation baselines against the original output. It does not require exact token-for-token matches."*

---

## Verdict

**SOUND WITH AMENDMENTS**

The strategic intent is sharp, and decoupling the CV structural manipulation from job-tailoring is exactly the correct fix. However, the engineering execution rules are overly rigid and naive about data boundaries. 

**Required Amendments before Build Phase:**
1.  **Amend Section 3:** Replace "exact same outcome" with "structural parity and semantic equivalence." 
2.  **Amend Section 6.2 (The Handoff):** Define the handoff strictly as a JSON/AST data structure. Ban both the Builder and the Tailor from rendering `.docx` files directly; defer that to a dedicated rendering microservice.
3.  **Amend Section 6.4 (Advocacy Principle):** Add a constraint that "high-risk/bold" state generated by the Tailor must trigger explicit user warnings about interview prep before the CV can be exported, protecting the system from users who skip steps.
4.  **Amend Section 5b:** Add a caveat to "Replace, do not repair" stating that legacy Node scripts must be containerized or abstracted via an API layer to prevent blocking the web server's event loop.
