# HairAssessment Specification

## Overview

- Target file: `src/components/sites/manmatters-com-61d14dee/hair-form-assessment-cb152271/HairAssessment.tsx`
- Interaction model: click-driven
- Responsive: two answer cards per row on desktop, one card per row below 560px.

## DOM structure

Shared header; pale-blue page canvas; centred form shell; step label/progress bar; question heading; answer-card grid; navigation controls; outcome card.

## Styles

- Canvas: `#f2f7fc`, min-height `calc(100vh - 96px)`.
- Form shell: white, max-width `760px`, border-radius `24px`, `box-shadow: 0 18px 60px rgba(20,52,97,.12)`.
- Primary action: `#143461` background, white text, `10px` radius.
- Selected card: `#e8f1fc` background, `#22548a` border.

## States and behaviors

- Before an answer is selected: Continue is disabled.
- After an answer is selected: selected card changes background/border; Continue becomes enabled.
- Continue and Back switch the content state; result state exposes Start over.

## Text content

`Your hair, understood.`; `Answer a few quick questions to get a hair-care plan tailored to you.`; `What would you like help with today?`; `How long have you noticed this concern?`; `Which area concerns you the most?`; `How would you describe your scalp?`; `How often do you currently care for your hair?`; `Your personalised starting point`.
