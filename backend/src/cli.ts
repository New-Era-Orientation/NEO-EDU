
import { query } from "./services/db.js";
import bcrypt from "bcrypt";
import * as readline from "readline";

const args = process.argv.slice(2);
const command = args[0];

const showHelp = () => {
    console.log(`
Usage: npm run cli <command> [args]

Commands:
  create-admin <email> <name> [password]  Create a new admin user
  list-users [role]                       List users (optional: filter by role)
  set-role <email> <role>                 Change a user's role (admin, instructor, student)
  reset-password <email> [new-password]   Reset a user's password
  delete-user <email>                     Delete a user
  help                                    Show this help message
`);
};

const askQuestion = (query: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
};

const createAdmin = async () => {
    const email = args[1];
    const name = args[2];
    let password = args[3];

    if (!email || !name) {
        console.error("Error: Email and Name are required.");
        console.log("Usage: npm run cli create-admin <email> <name> [password]");
        process.exit(1);
    }

    if (!password) {
        password = await askQuestion("Enter password: ");
    }

    try {
        const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            console.error("Error: User with this email already exists.");
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await query(
            `INSERT INTO users (email, password_hash, name, role, must_change_password, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', false, NOW(), NOW())
       RETURNING id, email, name, role`,
            [email, hashedPassword, name]
        );

        console.log("Admin created successfully:", result.rows[0]);
    } catch (err) {
        console.error("Error creating admin:", err);
    }
};

const listUsers = async () => {
    const role = args[1];
    let queryText = "SELECT id, email, name, role, created_at FROM users";
    const params: any[] = [];

    if (role) {
        queryText += " WHERE role = $1";
        params.push(role);
    }

    queryText += " ORDER BY created_at DESC";

    try {
        const result = await query(queryText, params);
        console.table(result.rows);
    } catch (err) {
        console.error("Error listing users:", err);
    }
};

const setRole = async () => {
    const email = args[1];
    const role = args[2];

    if (!email || !role) {
        console.error("Error: Email and Role are required.");
        console.log("Usage: npm run cli set-role <email> <role>");
        process.exit(1);
    }

    if (!["student", "instructor", "admin"].includes(role)) {
        console.error("Error: Invalid role. Must be one of: student, instructor, admin");
        process.exit(1);
    }

    try {
        const result = await query(
            "UPDATE users SET role = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, role",
            [role, email]
        );

        if (result.rows.length === 0) {
            console.error("Error: User not found.");
            process.exit(1);
        }

        console.log("User role updated:", result.rows[0]);
    } catch (err) {
        console.error("Error updating role:", err);
    }
};

const resetPassword = async () => {
    const email = args[1];
    let newPassword = args[2];

    if (!email) {
        console.error("Error: Email is required.");
        console.log("Usage: npm run cli reset-password <email> [new-password]");
        process.exit(1);
    }

    if (!newPassword) {
        newPassword = await askQuestion("Enter new password: ");
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const result = await query(
            "UPDATE users SET password_hash = $1, must_change_password = true, updated_at = NOW() WHERE email = $2 RETURNING id, email",
            [hashedPassword, email]
        );

        if (result.rows.length === 0) {
            console.error("Error: User not found.");
            process.exit(1);
        }

        console.log("Password reset successfully. User will be prompted to change it on next login.");
    } catch (err) {
        console.error("Error resetting password:", err);
    }
};

const deleteUser = async () => {
    const email = args[1];

    if (!email) {
        console.error("Error: Email is required.");
        console.log("Usage: npm run cli delete-user <email>");
        process.exit(1);
    }

    const confirm = await askQuestion(`Are you sure you want to DELETE user ${email}? (yes/no): `);
    if (confirm.toLowerCase() !== "yes") {
        console.log("Operation cancelled.");
        process.exit(0);
    }

    try {
        const result = await query("DELETE FROM users WHERE email = $1 RETURNING id", [email]);

        if (result.rows.length === 0) {
            console.error("Error: User not found.");
            process.exit(1);
        }

        console.log("User deleted successfully.");
    } catch (err) {
        console.error("Error deleting user:", err);
    }
};

const main = async () => {
    try {
        switch (command) {
            case "create-admin":
                await createAdmin();
                break;
            case "list-users":
                await listUsers();
                break;
            case "set-role":
                await setRole();
                break;
            case "reset-password":
                await resetPassword();
                break;
            case "delete-user":
                await deleteUser();
                break;
            case "help":
            default:
                showHelp();
                break;
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    } finally {
        process.exit(0);
    }
};

main();
