# Product Requirements Document (PRD)
## The Neighborhood Collective

## One-line summary
A private, invite-only marketplace that connects homeowners within a specific neighborhood to a curated, limited set of local businesses offering exclusive neighborhood pricing, deals, and recommendations.

---

## Target users

### Primary user
- Homeowners within a defined geographic neighborhood

### Secondary users
- Local service-based businesses seeking customers within a specific neighborhood

---

## Problem statement
Homeowners lack a trustworthy, organized, and incentive-aligned way to discover and engage local service providers specific to their neighborhood. Existing platforms (Facebook groups, Nextdoor, Google Reviews) are noisy, uncurated, spam-prone, and not structured to create leverage or collective bargaining power for residents.

Local businesses, in turn, lack a focused, high-intent channel to reach verified homeowners in a specific neighborhood without competing against unlimited peers or paying for low-quality leads.

---

## Core value proposition
The Neighborhood Collective "unionizes" neighbors by limiting the number of businesses per category in each neighborhood, creating exclusivity, higher trust, and leverage for better pricing, deals, and service quality—while giving businesses qualified, localized access to homeowners.

---

## MVP scope (must ship)

Homeowners must be able to:
1. Accept an invitation and join a specific neighborhood
2. Browse a curated list of recommended professionals, services, and deals available in that neighborhood
3. Bookmark businesses for future reference
4. Recommend businesses to the neighborhood via positive recommendation-style reviews
5. Interact with an app-specific LLM that acts as a sales and service assistant

Businesses must be able to:
1. Create and manage a detailed business profile
2. Define services offered, categories, and sub-categories
3. Subscribe to neighborhood-specific memberships as an exclusive "Neighborhood Favorite"
4. Interact with an app-specific LLM that functions as a sales and service representative

Admins/Moderators must be able to:
1. Manage neighborhoods, users, businesses, and content
2. Enforce business limits per category per neighborhood
3. Moderate recommendations and comments
4. Approve or reject invitations and business participation

---

## Non-goals (explicitly out of scope)

- No self-promotional posts by neighbors
- No spam or incentivized reviews
- No peer-to-peer private messaging between users
- No complaint-based reviews (reviews are recommendations only)
- No harassment, hate speech, or inappropriate language
- No public access to neighborhood data or business listings
- No open marketplace with unlimited businesses per category

---

## Key screens (MVP)
- Invitation request / verification screen
- Neighborhood onboarding / join flow
- Neighborhood business directory
- Business profile detail page
- Bookmark and recommendation interface
- AI assistant chat interface
- Business subscription management dashboard
- Admin moderation dashboard

---

## Core objects (nouns)
- User
- Neighbor
- Neighborhood
- Invite
- Business
- Category
- Sub-Category
- Service
- Bookmark
- Recommendation
- Comment
- Subscription

---

## Roles & permissions (high level)

### Anonymous visitor
- Can only view a landing page
- Can request an invitation by submitting qualification information
- Cannot view neighborhoods, businesses, or recommendations

### Logged-in neighbor
- Can view businesses operating in their neighborhood
- Can bookmark businesses
- Can submit recommendation-style reviews
- Can interact with the AI assistant
- Cannot privately message other users
- Cannot self-promote or submit complaints

### Business
- Can create and manage a business profile
- Can define services, categories, and offerings
- Can manage neighborhood-specific subscriptions
- Can interact with the AI assistant
- Cannot review or recommend their own business

### Admin / Moderator
- Full CRUD access across all objects
- Can approve/reject users and businesses
- Can enforce category limits and subscription rules
- Can moderate content and remove violations

---

## Monetization

### Initial
- Paid, neighborhood-specific subscriptions for businesses as exclusive "Neighborhood Favorites"

### Future (not MVP)
- Tiered business subscriptions
- Featured placements (still limited)
- Neighborhood-sponsored perks or programs

---

## Success criteria
- Homeowners regularly use the directory instead of external platforms
- Businesses receive qualified neighborhood leads
- High signal-to-noise ratio in recommendations
- Low moderation overhead due to structural constraints

---

## Constraints
- Invite-only, neighborhood-verified access
- Limited businesses per category per neighborhood
- Supabase-backed architecture
- AI-assisted development and moderation
- Non-technical founder workflow
