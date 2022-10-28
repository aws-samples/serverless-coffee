# Welcome to the Serverlesspresso Production repo V3!

This section demonstrates the extensibility of event driven architectures. New functional requirements come up all the time in production applications. We can address new requirements for an event driven application by creating new rules for events in the Event Bus. These rules can add new functionality to the application without having any impact to the existing application stack.

This section shows how to build an extension for serverelsspresso that adds new functionality while remaining decoupled frim teh core application.

## Characteristics of an EDA extension

1. Extension resources do not have permission to interact with resources outside the extension definition (including core app resources).

2. Extensions must contain at least 1 new EventBrige rule that routes existing serverlesspresso Events.

3. Extensions can be deployed independently of other extensions and the core application.

## Submitting your extension

## The events player

### Deploying the events player

### Running the events player

