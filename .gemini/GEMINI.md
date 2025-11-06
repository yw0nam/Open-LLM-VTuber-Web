# Rule

1. Retrieve the task using task-master tool.
2. Before complete the task, ensure test the code using the command `npm run test --slient`, Note use slience mode for suppress the token usage.
3. You have to keep assert based testing style when you write tests.
4. You have to keep compatible with api and websocket of backend, when you modify the code related to api or websocket, make sure to check the backend. You can find api and websocket here: /home/spow12/codes/2025_lower/DesktopMatePlus/backend/src/api and you can find the response, request schema in the /home/spow12/codes/2025_lower/DesktopMatePlus/backend/src/models file in the backend repository.
5. Update the E2E tests file /home/spow12/codes/2025_lower/DesktopMatePlus/Open-LLM-VTuber-Web/src/renderer/src/services/__tests__/api-integration.test.ts to cover the new changes. other test is okay using mock for fast unit test, but E2E test should cover the real api and websocket interaction.