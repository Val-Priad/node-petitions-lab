# Petitions Web Application

## Project Overview
This project is a **Web Application for Creating and Managing Petitions**.  
It allows users to register, create petitions, sign them, and track their progress.  
The system supports role-based access (admin vs. regular user) and ensures data consistency through a relational database design.

---

## Project Structure
- **authors** – manages user accounts and authentication (username, password, admin role).  
- **petitions** – stores petitions data including title, text, creation/expiry dates, status, and author reference.  
- **signatures** – manages signatures for petitions, including which author signed and when.  

The system is designed based on an **ER diagram** with relationships:  
- One `author` can create multiple `petitions`.  
- One `petition` can have multiple `signatures`.  
- Each `signature` links an `author` with a `petition`.  

---

## Functional Capabilities
- User registration and authentication.  
- Petition creation, editing, and deletion by authors.  
- Signing petitions by registered users.  
- Automatic status update when petitions expire.  
- Administrative role for managing users and petitions.  

---

## Non-functional Requirements
- **Scalability** – modular structure to support future extensions.  
- **Maintainability** – clean architecture with separation of concerns.  
- **Usability** – intuitive user interface and clear navigation.  

---

## Installation and Setup

### Requirements
- Node.js | Express.js  
- MySQL | Sequelize  
- HTML | CSS |JavaScript
