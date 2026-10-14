# Apcosys Data Collection Policy

_Last updated: August 4, 2025_

## Table of Contents

- [What and How Apcosys Collects](#what-and-how-apcosys-collects)
- [Purpose](#purpose)
- [Legislation](#legislation)
- [How to Make Information Private](#how-to-make-information-private)

## What and How Apcosys Collects

The Apcosys app collects only **publicly available, externally accessible data** using **nonintrusive** methods. Our algorithms employ standardized, open network protocols to query hosts and retrieve specific attributes. Examples of collected data include:

- **Exposed Ports:**  
  Networked applications use specific ports for communication, such as TCP ports 80 or 443 for web traffic. Security best practices recommend limiting open ports to only those necessary. Services behind these ports often share public metadata known as **“banners.”**

- **SSL Certificates:**  
  These enable encrypted communications and contain **public information** like public keys, domain names, and details about the certificate’s issuer, ensuring secure connections.

- **Whois Database:**  
  This includes **public information** about domains, registrants, and registrars, as required by the Internet Corporation for Assigned Names and Numbers (ICANN) for public access via Whois directories.

These data types are nonintrusive, as they are publicly accessible to anyone using standard web tools.

## Purpose

Our goal is to assist users in **research, marketing, and enhancing cybersecurity**. We aim to contribute to a safer, more robust Internet, aligning with principles like those outlined at <https://www.mozilla.org/en-US/about/manifesto/>. Apcosys supports this vision by providing tools for informed decision-making.

We **do not** use intrusive techniques, conduct penetration testing, bypass security measures, or access private data **without explicit consent and verified ownership**. Upon request, we can perform detailed scans of hosts you own using intrusive methods, with results provided exclusively to you.

## Legislation

Apcosys complies with applicable laws, including the **U.S. Computer Fraud and Abuse Act (CFAA)**, by collecting only public data without unauthorized access. Our operations are designed to respect the **confidentiality, integrity, and availability** of digital assets.

## How to Make Information Private

If Apcosys reveals information about your host that you prefer to keep private, you can restrict access by **reconfiguring your software**. Use Apcosys to **rescan your hosts** and verify changes to your security perimeter.
