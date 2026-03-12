name: Question / Help
description: Ask a question or request help with using Prohibeo
title: "[Question] "
labels: ["question"]
body:
  - type: textarea
    id: question
    attributes:
      label: Your Question
      description: What would you like to know or understand better?
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: Context
      description: What are you trying to accomplish? What's your use case?
    validations:
      required: true
  - type: textarea
    id: tried
    attributes:
      label: What Have You Already Tried?
      description: Any troubleshooting steps you've taken
  - type: input
    id: version
    attributes:
      label: Prohibeo Version
      placeholder: e.g., 0.1.0
