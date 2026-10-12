# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

No production users yet. Central de Relatórios is a portfolio / technical-test project: its audience today is a
reviewer (recruiter, engineer, design lead) who opens the app to judge the upload-and-download flow and the quality
of the UI. The persona the UI is written for is someone who keeps fiscal documents (*documentos fiscais*: PDF,
XML, CSV, XLSX) in one place, sends new ones and fetches old ones.

## Product Purpose

Store report files and hand them back. Users upload a file, see it in a searchable list, and download it later.
Success is a reviewer completing both directions — send a file, find it, download it — without guidance, on desktop
or phone, and coming away convinced the flow is sound.

## Positioning

File bytes never touch the API: the browser PUTs straight to S3 through a short-lived presigned URL (15 min) and
downloads through another (2 min). Every file has a visible lifecycle — `PENDING` while the upload is in flight or
abandoned, `AVAILABLE` once confirmed, `EXPIRED` when the hourly cleanup retires an abandoned intent.

## Operating Context

Single screen, no router: list, search by file name (case-insensitive), filter by type, paginate, upload through a
dialog, download per row. UI text is pt-BR. Sending and fetching carry equal weight.

## Capabilities and Constraints

- Types: pdf, xml, csv, xlsx; size 1 B–50 MB, validated on the client and the server.
- Only `AVAILABLE` reports download; `PENDING` rows are listed but not downloadable.
- Upload retries once automatically after a network error; an expired upload URL (S3 `403`) offers a retry that
  creates a new report.
- Not built: login, per-user ownership, delete, server-side check that the upload exists. Do not imply them.
- Must work on phones: the list cannot break at small widths.

## Brand Commitments

None. No logo, colour or typeface is official; the product name "Central de Relatórios" is the only identity in use.

## Evidence on Hand

No real customers, metrics or testimonials. Any sample data shown in mocks or fixtures is synthetic and must be
labelled as such.

## Product Principles

1. Show the lifecycle honestly: a reviewer should tell at a glance what can be downloaded now and what cannot.
2. Upload and download are peers; neither hides behind the other.
3. The list is the product: chrome never costs rows or legibility.
4. Small screens are a first-class target, not a fallback.
