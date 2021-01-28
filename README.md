# Vinted Clone backend - React Application creation test

<h1 align="center">
<br>
<img
		width="450"
		alt="vinted Clone - React App"
		src="preview\vintedClone-logo.gif">

<br>
<br>
A server application to manage APIs for user connexion and sale offers management.
<br>
<br>

</h1>

## General info

This project, carried out as part of the [Le Reacteur](https://www.lereacteur.io/) training, aims to put into practice our knowledge in React on the backend part.

The Vinted Clone project is composed of 2 parts the frontend and the backend (application treated here).
The latter exposes APIs (used by the frontend) and extracts or stores data in a `MongoDB` database.

This project, with a pedagogical aim, should allow us to put forward our knowledge to employers.

## Overview

This application manages 3 categories of data with simplified models to manage the required functionalities :

- `User` : 2 APIs allow to create a new user (with an image) and to authenticate him. A third route allows to reset the password with a random value sent by mail (with `Mail gun`).

- `Offer`: 5 APIs allow to process offers from their creation (with management of 5 images) to their consultation: creation, modification, deletion and detail of an offer and global list of offers.

- `Payment`: 1 API allows you to buy an offer by making a bank payment (with `Stripe`).

The images are stored in `Cloudinary`.

## Features

This project proposes the following APIs :

### - /user

- /user/signup

| HTTP Verb | Description       | Fields Param                              |
| --------- | ----------------- | ----------------------------------------- |
| `Post`    | create a new user | email, username, phone, password, picture |

- /user/login

| HTTP Verb | Description                   | Fields Param    |
| --------- | ----------------------------- | --------------- |
| `Post`    | authenticate a user to log in | email, password |

- /user/initialize

| HTTP Verb | Description         | Fields Param |
| --------- | ------------------- | ------------ |
| `Post`    | reset user password | email        |

### - /offer

- /offers

| HTTP Verb | Description                                                | Query Param                                                      |
| --------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `Get`     | Return a offers page depend on indicated criteria and sort | title, priceMin, priceMax, sort, page, limit, startDate, endDate |

- /offer

| HTTP Verb | Description    | Fields Param                                                                   |
| --------- | -------------- | ------------------------------------------------------------------------------ |
| `Post`    | Create a offer | title, description, price, condition, city, brand, size, color, pictures [1-5] |
| `Put`     | Update a offer | id, title, description, price, condition, city, brand, size, color, picture    |
| `Delete`  | Delete a offer | id                                                                             |

- /offer/id

| HTTP Verb | Description              | Fields Param |
| --------- | ------------------------ | ------------ |
| `Get`     | Return a specified offer | None         |

### - /payment

| HTTP Verb | Description                   | Fields Param                                                                                |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| `Post`    | Create a payment for an offer | label, quantity, price, deliveryCost, insuranceCost, amount, currency, offerId, stripeToken |

## Technologies

- cors - version 2.8.5
- dotenv - version 8.2.0
- crypto-js - version 4.0.0
- uid2 - version 0.0.3
- express - version 4.17.1
- express-formidable - version 1.2.0
- mongodb - version 3.6.3
- mongoose - version 5.10.13
- node - version 14.12.12
- cloudinary - version 1.23.0
- stripe - version 8.121.0
- mailgun - version 0.22.0

## Setup

Clone the repository then install the dependencies using `npm install`.

Then create an .env file with the following global parameters:

- PORT,
- MONGODB_URI,
- CLOUDINARY_NAME,
- CLOUDINARY_API_KEY,
- CLOUDINARY_API_SECRET,
- MAILGUN_API_KEY,
- MAILGUN_DOMAIN_SECRET,
- MAILGUN_MAIN_EMAIL,
- MAILGUN_AUTHORIZED_EMAILS,
- STRIPE_SECRET_KEY

Use `npm start` to launch the server.

You can also visit the demo server, by following the url below and completing the final part of the route :

https://reacteur-vinted.herokuapp.com/

## Status

Project is _finished_.

## Cautionary note

This project was carried out in a limited time with predefined guidelines. Also, this project may contain improvement points to comply with good practices.

## Inspiration

This projet is kind of simplified replica of [official vinted website](https://www.vinted.fr/).

## 📈 Stats

<br>
<br> 
<img align="center" src="https://wilclauzel-activitycounter.herokuapp.com/counter/GitHub/VintedS?kind=SVG"/>
<br>
<br>
