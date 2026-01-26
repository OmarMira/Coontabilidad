
import { initDB, db, getUsers, getUserRoles } from './src/database/simple-db.ts';

async function check() {
    await initDB();
    if (!db) {
        console.error('DB not initialized');
        return;
    }

    console.log('--- ROLES ---');
    const roles = getUserRoles();
    console.log(JSON.stringify(roles, null, 2));

    console.log('--- USERS ---');
    const users = getUsers();
    console.log(JSON.stringify(users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role_name })), null, 2));
}

check();
