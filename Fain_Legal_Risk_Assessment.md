# Fain — Independent Legal Risk Assessment
**Date:** 2026-06-20  
**Assessor:** Fain / Claude (Sonnet 4.6) — *not a qualified legal professional; requires review by counsel*  
**Matter:** Fain AI Financial Controller — corporate structure, regulatory exposure, data privacy, AI liability  
**Context:** Assessment performed independently of the attached ChatGPT report; disagreements are explicit.

---

## 0. Scope & Method

This assessment covers Fain as described:

- **Product:** AI financial controller for Georgian (and global) SME founders; plain-language answers to cash/burn/runway questions; pulls 24 months of bank transactions via Salt Edge; stores data client-side in IndexedDB; sends category-level aggregates to Claude (Anthropic API) for analysis.
- **Proposed structure:** UK Ltd (IP / commercial parent) + Georgia LLC (development / operations).
- **Primary market:** Georgian SME founders; secondary: global.

Risks are scored on **Severity (1–5) × Likelihood (1–5)**. Scores 1–4 = GREEN, 5–9 = YELLOW, 10–15 = ORANGE, 16–25 = RED.

---

## 1. Where I Disagree With the ChatGPT Report

Before the risk register, here are the specific claims in the report that are wrong, incomplete, or dangerously vague.

### 1.1 ❌ UK Corporate Substance — Not Mentioned at All

ChatGPT recommends "UK Ltd as parent/IP holding company" without once mentioning **management and control**.

Under UK law and HMRC practice, a company is UK tax-resident only if it is **managed and controlled in the UK**. If Archil and the founding team sit in Georgia and make all decisions from Georgia, HMRC will likely treat the UK company as Georgian-managed — meaning it is NOT UK tax-resident. The entire commercial rationale (investor credibility, banking aggregator relationships, GDPR controller status) then collapses.

This is not a minor oversight. The structure only works if there is genuine UK substance: UK-based director(s) with real decision-making authority, board meetings held in the UK, material contracts signed in the UK. Recommending the structure without flagging this is misleading.

### 1.2 ❌ Georgian National Bank (NBG) Regulation — Completely Absent

The report does not mention the **National Bank of Georgia (NBG)** once. Fain's primary market is Georgian SME founders. The NBG regulates "payment service providers," "money market institutions," and, under evolving Georgian financial regulation, potentially software that provides financial analysis services.

Whether Fain constitutes a regulated activity in Georgia is a genuine open question that requires Georgian legal counsel. ChatGPT did not raise it.

### 1.3 ❌ UK FCA Analysis is Too Thin

The report says "avoid obtaining fintech/AISP/PSP license." That may be correct, but it doesn't address whether Fain's activities constitute **regulated activities under FSMA 2000**. Specifically:

- Does providing AI-generated cash-flow forecasts, runway estimates, and burn analysis constitute "advising on investments"?
- Does the phrase "CFO-style insights" in marketing materials push Fain toward regulated territory?

The correct analysis requires mapping Fain's specific product outputs against the FSMA 2000 Regulated Activities Order, which ChatGPT did not do. The safe answer is not "don't get licensed" — it is "confirm with FCA counsel that no Part 4A permission is required and document that analysis."

### 1.4 ❌ The Privacy Guarantee Is Overstated Without Qualification

ChatGPT says "raw transaction data should not be stored on company servers." Fain's architecture already achieves this (IndexedDB, client-side only). But the privacy claim as typically described — *"data never leaves your browser"* — is **partially false** as stated:

When a user asks Fain a question, category-level aggregates are sent to Anthropic's API (Claude). Anthropic processes this data on Fain's behalf. This is cross-border data transfer (Georgia/UK → US). Under UK GDPR, this requires either Standard Contractual Clauses (SCCs), the UK International Data Transfer Agreement (IDTA), or reliance on Anthropic's Data Processing Agreement.

Fain's marketing must say *"raw transactions never leave your device"* — not *"your financial data never leaves your browser"* — because aggregates do leave the browser, they just don't go to Fain's servers.

### 1.5 ❌ Anthropic as Data Processor — Not Mentioned

ChatGPT lists DPAs as required documents but doesn't identify **Anthropic as a data processor**. Under UK GDPR Art. 28, Fain (as data controller) must have a binding DPA with every processor. Anthropic is a processor. Anthropic does publish an API DPA, but it must be explicitly entered into and its terms must be consistent with Fain's privacy obligations.

Additionally: Fain must verify that Anthropic does **not** use API inputs for model training (Anthropic's API terms currently state it does not, but this should be contractually confirmed in the DPA).

### 1.6 ⚠️ IP Transfer Mechanics Not Addressed

ChatGPT says UK holds IP, Georgia does development. But if Georgian developers employed by the Georgian LLC build the software, the **IP is initially owned by the Georgian LLC**. Transferring it to the UK parent requires:

- Formal IP assignment agreements
- Potential Georgian withholding tax on the assignment (depending on structure)
- Ongoing service/IP licensing agreement between UK parent and Georgian subsidiary for future development
- Transfer pricing documentation to satisfy Georgian and UK tax authorities

ChatGPT mentioned the destination of IP but not the mechanics or tax cost of getting it there.

### 1.7 ⚠️ The "AI Disclaimer" is Treated as a Checkbox

ChatGPT lists "AI Disclaimer" as a document to prepare, full stop. This is dangerously thin. Given that Fain's outputs will directly inform business decisions (runway planning, spending cuts, hiring freezes), the disclaimer must:

- Distinguish between **information** and **financial advice** (legally material)
- Be **conspicuous** in the product UI, not buried in ToS
- Specify that Claude's outputs may be incorrect and should not be sole basis for financial decisions
- Be reviewed by FCA counsel to confirm it does not constitute a financial promotion under FSMA s.21

---

## 2. Risk Register

### RISK-001: UK Corporate Substance Failure
**Category:** Corporate / Tax  
**Description:** If management and control of the UK Ltd remains in Georgia, HMRC may not recognise it as UK tax-resident. The company could be dual-resident, subject to Georgian CIT, or fail to provide the investor/credibility benefits intended.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **5 — Critical** | Undermines the entire proposed structure; investor credibility, banking relationships, and GDPR controller status depend on UK residency |
| Likelihood | **4 — Likely** | If Archil and team are Georgia-based with no UK director making real decisions, management and control is factually in Georgia |
| **Risk Score** | **20 — 🔴 RED** | |

**Mitigations:**
- Appoint a UK-resident director with real (not nominal) authority
- Hold board meetings in UK; document decisions made in UK
- Take legal opinion from UK corporate counsel confirming the company is UK-managed
- Consider a nominee/professional director arrangement (common for international founders) — but this must reflect genuine governance

---

### RISK-002: Georgian NBG Financial Services Regulation
**Category:** Regulatory  
**Description:** The National Bank of Georgia may classify Fain as providing financial analysis services that require authorization, registration, or disclosure under Georgian law. This risk is heightened because the primary market is Georgian founders.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **4 — High** | Forced product changes, operating restrictions, or fines in primary market |
| Likelihood | **3 — Possible** | Georgian financial regulation is evolving; whether AI-generated financial analysis falls within NBG scope is unsettled |
| **Risk Score** | **12 — 🟠 ORANGE** | |

**Mitigations:**
- Retain Georgian legal counsel with NBG regulatory expertise *before* public launch
- Obtain written opinion on whether Fain's activities require NBG notification or authorization
- Structure product as "financial information" tool, not "financial advice" tool — this distinction matters in Georgian law as much as UK law
- If NBG registration required, factor into launch timeline

---

### RISK-003: UK FCA Regulated Activity Exposure
**Category:** Regulatory  
**Description:** Fain may inadvertently conduct regulated activities under FSMA 2000 by providing cash-flow forecasts, investment-adjacent analysis, and "CFO-style" recommendations to UK-based users without FCA authorization.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **5 — Critical** | Criminal offence (s.19 FSMA) for conducting regulated activity without authorization; potential injunctions, fines, restitution orders |
| Likelihood | **2 — Unlikely** | Fain's outputs are financial information, not advice on specific investment decisions — the boundary is manageable with careful product design and legal opinion |
| **Risk Score** | **10 — 🟠 ORANGE** | |

**Mitigations:**
- Obtain written FCA exclusion analysis from UK financial services counsel before UK launch
- Ensure all product outputs are framed as information/analysis, not recommendations to buy/sell/invest
- Avoid language like "you should" or "we recommend" in AI outputs
- Review marketing materials for s.21 financial promotion compliance
- Apply "software tool" exclusion (RAO Art. 72C) analysis carefully

---

### RISK-004: GDPR / UK GDPR — International Data Transfer to Anthropic (US)
**Category:** Data Privacy  
**Description:** When users query Fain, category-level financial aggregates are transmitted to Anthropic's API (US servers). This constitutes a transfer of personal data to a third country. No IDTA/SCC or Anthropic DPA is in place at launch.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **4 — High** | ICO enforcement, regulatory fines (up to £17.5m or 4% global turnover under UK GDPR); reputational damage undermining the privacy-first brand |
| Likelihood | **3 — Possible** | The transfer is inherent to the architecture; without proper legal basis it is non-compliant from day one |
| **Risk Score** | **12 — 🟠 ORANGE** | |

**Mitigations:**
- Enter into Anthropic's API Data Processing Agreement *before* processing any user data
- Confirm Anthropic's IDTA/SCC coverage for UK → US transfers
- Update Privacy Policy to disclose Anthropic as a sub-processor
- Correct the privacy marketing claim to "raw transactions never leave your device" (not "data never leaves your browser")
- Document the legitimate interest or consent basis for the transfer

---

### RISK-005: AI Output Liability — Financial Decisions Made on Wrong Data
**Category:** Product / Liability  
**Description:** A founder relies on Fain's runway estimate (generated by Claude from transaction aggregates) to decide not to raise, then runs out of money. They claim Fain's output was wrong and sue.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **4 — High** | Financial loss claims; reputational damage; potential class action if systemic |
| Likelihood | **3 — Possible** | LLMs hallucinate; aggregate-level analysis can be structurally wrong; users will rely on outputs for real decisions |
| **Risk Score** | **12 — 🟠 ORANGE** | |

**Mitigations:**
- Strong limitation of liability in ToS (cap liability at fees paid or a fixed low amount)
- Conspicuous in-product disclaimer on every AI response ("This is financial information, not advice. Verify with your accountant.")
- Clear error states when data is incomplete or stale
- Explicit exclusion of consequential/indirect damages
- Review disclaimer wording with FCA counsel to ensure it is legally effective and not itself a misleading financial promotion

---

### RISK-006: Salt Edge Vendor Dependency
**Category:** Commercial / Operational  
**Description:** The entire product depends on Salt Edge for bank connectivity. If Salt Edge changes pricing, exits Georgia/BOG/TBC markets, is acquired, or changes API terms, Fain has no connectivity.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **5 — Critical** | Product non-functional without bank connectivity |
| Likelihood | **2 — Unlikely** | Salt Edge is established and unlikely to exit core markets soon; but early-stage Fain has no negotiating leverage |
| **Risk Score** | **10 — 🟠 ORANGE** | |

**Mitigations:**
- Negotiate contractual protections in Salt Edge agreement: minimum notice period for material changes, SLA for Georgian bank coverage
- Evaluate backup aggregators (Nordigen/GoCardless, Plaid for non-Georgian, Mono for CIS) as contingency
- Architecture should abstract the aggregator layer so switching is possible
- Avoid public commitments to specific banks that Salt Edge might drop

---

### RISK-007: Georgian Bank Access — Not PSD2-Mandated
**Category:** Regulatory / Technical  
**Description:** BOG and TBC are not subject to PSD2 or UK Open Banking. Salt Edge accesses them via proprietary agreements or screen-scraping, which is more fragile and potentially restricted by the banks' own ToS.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **3 — Moderate** | Core feature unavailable for primary market if Georgian banks restrict third-party access |
| Likelihood | **3 — Possible** | Georgian banks have no legal obligation to permit third-party access; they could restrict it at any time |
| **Risk Score** | **9 — 🟡 YELLOW** | |

**Mitigations:**
- Confirm with Salt Edge the legal basis for BOG/TBC access (bank agreement vs. screen-scraping)
- Monitor BOG/TBC developer portals for API access programs
- Explore direct partnership with BOG/TBC as a long-term strategy
- Manual CSV upload as a fallback for users (reduces dependency on API access)

---

### RISK-008: IP Assignment — Georgia to UK Transfer
**Category:** IP / Tax  
**Description:** Code developed by Georgian developers in the Georgian entity is initially owned by that entity. Transferring it to the UK parent requires formal assignment, arm's-length pricing, and may trigger Georgian tax.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **3 — Moderate** | Tax liability on IP transfer; invalid IP ownership chain undermining UK company's IP claims |
| Likelihood | **3 — Possible** | Common issue in founder-led structures; often ignored until investor due diligence |
| **Risk Score** | **9 — 🟡 YELLOW** | |

**Mitigations:**
- Formalize IP assignment agreements from founding date
- Take Georgian tax advice on IP transfer structure (contribute vs. assign vs. license)
- Implement intercompany service agreement: Georgian entity provides development services to UK entity at arm's length
- Document transfer pricing methodology
- Register UK entity's IP (trademark, domain, copyright notices) formally

---

### RISK-009: Anthropic Model Training on API Data
**Category:** Data Privacy / Contractual  
**Description:** If Anthropic uses API inputs (which may contain financial aggregates about real users) for model training, Fain's users' data is being used without their consent.

| Dimension | Score | Rationale |
|---|---|---|
| Severity | **4 — High** | GDPR breach; fundamental breach of Fain's privacy promise |
| Likelihood | **1 — Remote** | Anthropic's current API terms explicitly state inputs are not used for training; but this must be contractually locked in |
| **Risk Score** | **4 — 🟢 GREEN** | Currently low, but must be actively monitored |

**Mitigations:**
- Execute Anthropic DPA (includes data processing commitments)
- Add contractual obligation to Anthropic agreement that inputs will not be used for training
- Monitor Anthropic ToS updates; any change to this policy is a material risk event requiring immediate action

---

## 3. Summary Risk Matrix

| Risk | Category | Severity | Likelihood | Score | Level |
|---|---|---|---|---|---|
| RISK-001: UK Substance | Corporate/Tax | 5 | 4 | **20** | 🔴 RED |
| RISK-002: Georgian NBG | Regulatory | 4 | 3 | **12** | 🟠 ORANGE |
| RISK-003: UK FCA | Regulatory | 5 | 2 | **10** | 🟠 ORANGE |
| RISK-004: GDPR/Anthropic Transfer | Data Privacy | 4 | 3 | **12** | 🟠 ORANGE |
| RISK-005: AI Output Liability | Product/Liability | 4 | 3 | **12** | 🟠 ORANGE |
| RISK-006: Salt Edge Dependency | Commercial | 5 | 2 | **10** | 🟠 ORANGE |
| RISK-007: Georgian Bank Access | Regulatory/Technical | 3 | 3 | **9** | 🟡 YELLOW |
| RISK-008: IP Assignment | IP/Tax | 3 | 3 | **9** | 🟡 YELLOW |
| RISK-009: Anthropic Training Data | Data Privacy | 4 | 1 | **4** | 🟢 GREEN |

---

## 4. Prioritised Action Plan

### Immediate (before any paying users or UK company formation)

1. **UK Counsel engagement** — Get written legal opinion on: (a) management and control plan for UK Ltd; (b) FCA regulated activity exclusion analysis; (c) s.21 financial promotion review of marketing copy. *Owner: Archil. Deadline: Before UK company formation.*

2. **Georgian legal counsel** — Get written opinion on NBG regulatory exposure for Fain's specific product. *Owner: Archil. Deadline: Before Georgian public launch.*

3. **Anthropic DPA** — Execute before any user data flows through the API. Verify training data exclusion is contractual. *Owner: Archil/tech team. Deadline: Before beta launch.*

4. **Fix the privacy claim** — Change all marketing/UI language to "raw bank transactions never leave your device" — not "your data never leaves your browser." *Owner: Product/design. Deadline: Immediately.*

### Pre-launch (before public launch)

5. **IP assignment agreements** — Formal assignment of all IP from Georgian developers/entity to UK parent, with Georgian tax advice. *Owner: Georgian legal counsel.*

6. **Salt Edge contract review** — Negotiate notice periods, market coverage SLAs, and confirm BOG/TBC access basis. *Owner: Archil.*

7. **ToS and AI Disclaimer** — Draft with UK legal counsel; ensure limitation of liability is enforceable; ensure AI disclaimer is conspicuous in-product (not just in ToS). *Owner: UK counsel + product team.*

### Ongoing (post-launch)

8. **UK substance maintenance** — Ensure UK director is making real decisions; document board resolutions; keep UK-managed governance records.

9. **Anthropic ToS monitoring** — Any change to data processing or training policies is a critical risk event. Set calendar reminder for quarterly review.

10. **Georgian bank access monitoring** — Track BOG/TBC API policy changes; maintain manual CSV upload as fallback.

---

## 5. What the ChatGPT Report Got Right

To be fair: the overall direction of the ChatGPT report is reasonable. Avoiding direct AISP/PSP licensing in Phase 1 is commercially sound. The UK + Georgia two-tier structure is a sensible starting point. The phased approach (grow first, add regulated status only when commercially necessary) is correct. The list of required legal documents is a useful starting checklist.

The problems are not in the recommendations themselves — they're in what was omitted. The ChatGPT report reads like a template applied to a generic fintech startup rather than an analysis tailored to Fain's specific architecture, primary market (Georgia), and the legal peculiarities of the proposed UK structure. It doesn't challenge its own conclusions, which is exactly what a real legal risk assessment must do.

---

*This document is not legal advice. It should be reviewed and validated by qualified legal professionals in the UK and Georgia before any reliance is placed on it.*
