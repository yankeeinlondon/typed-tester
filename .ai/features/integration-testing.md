# Integration Testing

Whereas "unit testing" is aimed at calling functions or testing type utilities, "integration testing" is about running the CLI through it's paces by actually executing CLI commands. 

There exists a set of integration tests which exist in `tests/integration` but they were created a while back and have always been a source of concern mainly because they execute so slowly they are constantly timing out and failing CI/CD. Furthermore they feel like they have not been designed with a clear focus. 

You _can_ review what's already there but it's entirely fine to throw out the current integration tests in favor of a new strategy.

## Test Strategy

- every command that the CLI exposes should have a test file which provides integrations tests for it
- every command should be analyzed for expected parameters/switches to produce a set of variants
  - each of these variants should have at least one integration test associated with it
- we must provide appropriate test files to allow our tests to produce meaningful results
- integration tests are expected to take longer than a unit test but none should take more then 5 seconds ever.

## Plan

please use the `orchestrator` sub-agent to handle the planning and build out the integration tests for this project.
