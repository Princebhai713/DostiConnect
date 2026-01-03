import type * as Party from "partykit/server";
import {faker} from "@faker-js/faker";

type User = {
  id: string;
  name: string;
};

export default class Server implements Party.Server {
  users: Map<string, User> = new Map();

  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.party.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  generateFunnyName() {
    const adjective = faker.word.adjective();
    const animal = faker.animal.type();
    return `${adjective.charAt(0).toUpperCase() + adjective.slice(1)} ${animal.charAt(0).toUpperCase() + animal.slice(1)}`;
  }


  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message);
    if (msg.type === 'identify') {
      const user: User = {
        id: sender.id,
        name: this.generateFunnyName(),
      }
      this.users.set(sender.id, user);

      // Welcome the new user and tell them their name
      sender.send(JSON.stringify({ type: 'welcome', user }));
      
      // Sync the full user list to the new user
      sender.send(JSON.stringify({ type: 'sync', users: Array.from(this.users.values()) }));
      
      // Inform everyone else that a new user has joined
      this.party.broadcast(
        JSON.stringify({ type: 'user-joined', user }),
        [sender.id] // Do not send to the new user
      );
    }
  }

  onClose(connection: Party.Connection) {
    const user = this.users.get(connection.id);
    if (user) {
      this.users.delete(connection.id);
      this.party.broadcast(
        JSON.stringify({ type: 'user-left', id: connection.id })
      );
      console.log(`Disconnected: ${connection.id}`);
    }
  }
}
