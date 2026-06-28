---
title: 'Surveyer'
description: 'Open-source tool for systematic paper discovery, deduplication, relevance scoring, snowballing, and PRISMA figure generation.'
github: 'https://github.com/IsmailHatim/Surveyer'
language: 'Python'
published: true
date: 2026-06-11
---

<img src="/images/projects/surveyer_logo.png" alt="Surveyer logo" width="400" style="display:block;margin:0 auto 1.5rem;">


***Surveyer*** is an open-source tool I built for systematic literature reviews across different sources:
The pipeline goes from paper discovery through deduplication, LLM relevance scoring, and also *PRISMA* figure generation.
It is specifically tailored to survey research papers since it can generate a detailed *PRISMA* figure, a *BibTeX* file with each paper citation and an *Excel* file containing all information about included and excluded papers. 

Here's a short demo of the TUI:

<img src="/images/projects/surveyer_demo.gif" alt="Surveyer TUI demo" style="display:block;margin:1.5rem auto;max-width:100%;border-radius:6px;">

Concretely how it works: you define concepts and their synonyms and search queries are built from them, fetching potential papers from explicit sources you can tweak in the config (Semantic Scholar, arXiv, OpenAlex, Google Scholar, DBLP, PubMed etc.). 
It will then deduplicate the results, score each paper for relevance with an LLM based on its abstract (if enabled), and export everything.
The relevance scoring runs on OpenAI or a fully local Ollama model, and the LLM judges each concept before scoring so every inclusion or exclusion comes with a reason in the spreadsheet.
You can also snowball (citation chasing) through OpenAlex to find related work, and pin must-cite seed papers that bypass the filters.
Everything is set up in one TOML file and the HTTP responses are cached, so rerunning is cheap and you can easily update the survey as new papers come out or share the config with collaborators.

> I decided to build it because no existing tool generated everything I needed for a systematic review: a precisely detailed PRISMA figure, an Excel file in this specific format, and the clean BibTeX export. 
> Because the diagrams are rendered with *Graphviz*, they're easy to tweak. And the whole project is very light.


Feel free to explore the GitHub repository of [Surveyer](https://github.com/IsmailHatim/Surveyer), and contribute if you'd like to!
