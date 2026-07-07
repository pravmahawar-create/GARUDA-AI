# GARUDA Autonomous Engineering Planner

## Architecture analysis

GARUDA inspects the current project architecture, module layout, dependencies, and available capabilities to understand the system before proposing work.

## Roadmap generation

The planner converts architecture observations into a prioritized roadmap with categories such as Critical, High, Medium, Low, Future Vision, Research, and Experimental.

## Priority algorithm

The planner estimates business value, engineering value, difficulty, and risk to calculate task priority. Every generated task remains advisory until founder approval.

## Founder approval workflow

The planner never modifies production code automatically. Any recommended work requires founder approval before implementation.
