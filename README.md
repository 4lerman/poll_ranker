
# Ranker

The Polling Application is a backend application developed using NestJs, Docker, Redis, Socket.io, Websockets, and JWT. The purpose of this project is to allow users to create polls, join polls, nominate candidates, vote on nominations, and calculate and present the results to the users. The application also includes features such as poll cancellation and closure, user authentication using JWT tokens, and administrative privileges for managing polls.

## Installation
To install and run the Polling Application, follow these steps:

Clone the repository:
```
git clone <repository_url>
```
Navigate to the project directory:

```
cd polling-application
```

Install the dependencies:
```
npm install
```
Set up the environment variables:
- Create a .env file in the root directory of the project.
- Add the required environment variables to the .env file. For example:
```
PORT=3000
CLIENT_PORT=8080
REDIS_HOST=localhost
REDIS_PORT=6379
POLL_DURATION=7200
JWT_SECRET={yousecret}

```
Start the application:
```
npm run start:dev
```

## Usage
The Polling Application provides a set of APIs for creating polls, managing nominations, and voting on candidates. Users can interact with the application by sending HTTP requests to the provided endpoints. The application also utilizes WebSocket and Socket.io for real-time updates and notifications.

Before using the application, make sure it is running locally or deployed to a server. By default, the application runs on http://localhost:3000.


## Endpoints

### Polls
- POST /polls - Create a new poll.
- POST /polls/join - Join an existing poll.
- POST /polls/rejoin - Rejoin a poll

### Client Messages

- "remove_participant" - admin removes remove_participant
- "nominate" - create a nomination for voting
- "remove_nomination" - remove a nomination
- "start_vote" - admin starts a voting
- "submit_rankings" - users submit their choices
- "close_poll" - close and calculate the results
- "cancel_poll" - delete the poll



## Tech Stack

**NestJs:** A progressive Node.js framework for building efficient and scalable server-side applications.

**Docker:** A platform for containerization and running applications in isolated environments.

**Redis:** An in-memory data store used for caching and real-time communication.

**Socket.io:** A library that enables real-time, bidirectional communication between clients and servers using WebSockets.

**Websockets:** A communication protocol that enables full-duplex communication between a client and a server over a single, long-lived connection.

**JWT:** JSON Web Tokens for authentication and authorization.

