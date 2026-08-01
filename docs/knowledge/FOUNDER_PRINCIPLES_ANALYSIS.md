# Document Summary
This document outlines founder-locked operational principles governing approval, cost, and autonomy within GARUDA. Key principles include founder approval for sensitive writes, minimizing founder keyboard input to high-level decisions, a local-first worker strategy, and blocking paid APIs.

# Engineering Rules
- Founder approval is required before sensitive writes.
- A local-first worker strategy should be employed.
- Paid APIs are blocked.

# Key Decisions
- **Founder Approval for Sensitive Writes**: Ensures critical operations are reviewed and approved by the Founder.
- **Minimized Founder Keyboard Input**: Optimizes Founder's time by limiting their involvement to high-level decisions (goal/approval/rejection).
- **Local-First Worker Strategy**: Prioritizes local execution for efficiency and control.
- **Blocked Paid APIs**: Enforces cost control and potentially promotes the use of open-source or internal solutions.

# Architecture Impact
The architecture must incorporate mechanisms for founder approval before sensitive writes. The emphasis on a local-first worker strategy suggests an architecture that supports distributed or local computation. The blocking of paid APIs implies that the system should either rely on free alternatives or internal implementations for functionalities that might otherwise require paid services.

# Founder Intent
The Founder intends to maintain strict control over critical operations and costs, while promoting an autonomous yet guided AI workforce. The principles aim to maximize efficiency and minimize unnecessary expenses.

# Constraints
- Founder approval is a mandatory step for sensitive writes.
- Design should support a local-first worker strategy.
- Integration with paid APIs is prohibited.

# Open Questions
- What constitutes a "sensitive write" and how is it defined within the system?
- What are the specific criteria for determining whether a worker should be "local-first"?
- What is the process for requesting an exception to the "Paid APIs blocked" rule, if any?
- How does the system ensure the Founder's keyboard input is minimized while still providing necessary oversight?