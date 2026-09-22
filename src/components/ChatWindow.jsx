export const createChat = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        message: "You cannot chat with yourself"
      });
    }

    // Check that the other user exists
    const userResult = await client.query(
      `
      SELECT id, email
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    /*
      Find an existing 1-to-1 chat
      containing BOTH users.
    */
    const existingChat = await client.query(
      `
      SELECT cp1.chat_id
      FROM chat_participants cp1
      INNER JOIN chat_participants cp2
        ON cp1.chat_id = cp2.chat_id
      INNER JOIN chats c
        ON c.id = cp1.chat_id
      WHERE cp1.user_id = $1
        AND cp2.user_id = $2
      GROUP BY cp1.chat_id
      HAVING COUNT(DISTINCT cp1.user_id) = 1
         AND COUNT(DISTINCT cp2.user_id) = 1
      LIMIT 1
      `,
      [req.user.id, userId]
    );

    if (existingChat.rows.length > 0) {
      return res.json({
        chat: {
          id: existingChat.rows[0].chat_id
        },
        existing: true
      });
    }

    // Create a new chat
    await client.query("BEGIN");

    const chatId = uuidv4();

    await client.query(
      `
      INSERT INTO chats (id)
      VALUES ($1)
      `,
      [chatId]
    );

    await client.query(
      `
      INSERT INTO chat_participants
      (id, chat_id, user_id)
      VALUES ($1, $2, $3)
      `,
      [uuidv4(), chatId, req.user.id]
    );

    await client.query(
      `
      INSERT INTO chat_participants
      (id, chat_id, user_id)
      VALUES ($1, $2, $3)
      `,
      [uuidv4(), chatId, userId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      chat: {
        id: chatId
      },
      existing: false
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create chat error:", error);

    res.status(500).json({
      message: "Could not create chat"
    });
  } finally {
    client.release();
  }
};