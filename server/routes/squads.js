const express = require('express');
const Groq = require('groq-sdk');
const db = require('../database');

const router = express.Router();

// Initialize Groq (you'll need to set GROQ_API_KEY in .env)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// AI-powered squad formation
const formSquadsWithAI = async (candidates, squadSize, formationType) => {
  try {
    const prompt = `
    Given these candidates with their skills:
    ${candidates.map(c => `${c.name} (ID: ${c.id}): ${c.skills}`).join('\n')}
    
    Form ${Math.ceil(candidates.length / squadSize)} squads with ${squadSize} members each.
    Formation type: ${formationType}
    
    If formation type is "similar": Group people with similar skills together
    If formation type is "diverse": Group people with different skills together
    
    IMPORTANT: Return ONLY a valid JSON array of arrays, where each inner array contains candidate IDs.
    Example: [[1,2,3,4], [5,6,7,8]]
    
    Do not include any text before or after the JSON. Only return the JSON array.
    `;

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    console.log('AI Response was:', response);
    
    // Try to extract JSON from the response
    let jsonMatch = response.match(/\[\[.*\]\]/s);
    if (!jsonMatch) {
      // If no JSON array found, try to parse the entire response
      jsonMatch = response;
    }
    
    const squads = JSON.parse(jsonMatch);
    
    // Validate the result
    if (!Array.isArray(squads) || squads.length === 0) {
      throw new Error('Invalid squad format returned by AI');
    }
    
    // Validate and fix squads to ensure no duplicates
    const validatedSquads = validateAndFixSquads(squads, candidates, squadSize);
    console.log('Validated squads:', validatedSquads);
    
    return validatedSquads;
  } catch (error) {
    console.error('AI squad formation error:', error);
    // Fallback to random formation
    return formSquadsRandom(candidates, squadSize);
  }
};

// Validate and fix squad formation to ensure no duplicates
const validateAndFixSquads = (squads, candidates, squadSize) => {
  const allCandidateIds = candidates.map(c => c.id);
  const usedIds = new Set();
  const validSquads = [];
  
  // First, collect all used IDs and validate
  for (const squad of squads) {
    if (Array.isArray(squad)) {
      const validSquad = [];
      for (const id of squad) {
        if (allCandidateIds.includes(id) && !usedIds.has(id)) {
          usedIds.add(id);
          validSquad.push(id);
        }
      }
      if (validSquad.length > 0) {
        validSquads.push(validSquad);
      }
    }
  }
  
  // If we don't have enough valid squads, create random ones with remaining candidates
  const remainingIds = allCandidateIds.filter(id => !usedIds.has(id));
  const shuffledRemaining = remainingIds.sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < shuffledRemaining.length; i += squadSize) {
    const squad = shuffledRemaining.slice(i, i + squadSize);
    if (squad.length > 0) {
      validSquads.push(squad);
    }
  }
  
  return validSquads;
};

// Random squad formation (fallback)
const formSquadsRandom = (candidates, squadSize) => {
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());
  const squads = [];
  
  for (let i = 0; i < shuffled.length; i += squadSize) {
    squads.push(shuffled.slice(i, i + squadSize).map(c => c.id));
  }
  
  return squads;
};

// Create squads with AI
router.post('/create-with-ai', async (req, res) => {
  const { squadSize = 4, formationType = 'diverse' } = req.body;

  try {
    // Get only candidates with present attendance status
    db.all(`
      SELECT DISTINCT c.* 
      FROM candidates c
      INNER JOIN attendance a ON c.id = a.candidate_id
      WHERE a.status = 'present'
      ORDER BY c.name
    `, async (err, candidates) => {
      if (err) {
        console.error('Error fetching candidates:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (candidates.length === 0) {
        return res.status(400).json({ 
          error: 'No candidates with present attendance status available. Please mark some candidates as present first.' 
        });
      }

      let squads;
      
      if (process.env.GROQ_API_KEY) {
        squads = await formSquadsWithAI(candidates, squadSize, formationType);
      } else {
        squads = formSquadsRandom(candidates, squadSize);
      }
      
      // Ensure no duplicates in final squads
      squads = validateAndFixSquads(squads, candidates, squadSize);

      // Create squads in database
      const createdSquads = [];
      
      // Use Promise to handle async database operations
      const createSquadsPromise = new Promise((resolve, reject) => {
        let completedSquads = 0;
        const totalSquads = squads.length;
        
        if (totalSquads === 0) {
          resolve([]);
          return;
        }
        
        for (let i = 0; i < squads.length; i++) {
          const squadName = `Squad ${i + 1}`;
          
          db.run('INSERT INTO squads (name) VALUES (?)', [squadName], function(err) {
            if (err) {
              console.error('Error creating squad:', err);
              reject(err);
              return;
            }

            const squadId = this.lastID;
            const memberIds = squads[i];

            // Add members to squad
            let addedMembers = 0;
            const totalMembers = memberIds.length;
            
            if (totalMembers === 0) {
              createdSquads.push({
                id: squadId,
                name: squadName,
                members: memberIds
              });
              completedSquads++;
              if (completedSquads === totalSquads) {
                resolve(createdSquads);
              }
              return;
            }
            
            memberIds.forEach(candidateId => {
              db.run('INSERT INTO squad_members (squad_id, candidate_id) VALUES (?, ?)', 
                [squadId, candidateId], function(err) {
                  if (err) {
                    console.error('Error adding member to squad:', err);
                    reject(err);
                    return;
                  }
                  
                  addedMembers++;
                  if (addedMembers === totalMembers) {
                    createdSquads.push({
                      id: squadId,
                      name: squadName,
                      members: memberIds
                    });
                    completedSquads++;
                    if (completedSquads === totalSquads) {
                      resolve(createdSquads);
                    }
                  }
                });
            });
          });
        }
      });

      try {
        const createdSquads = await createSquadsPromise;
        res.json({
          message: 'Squads created successfully',
          squads: createdSquads,
          formationType,
          squadSize
        });
      } catch (error) {
        console.error('Error creating squads:', error);
        res.status(500).json({ error: 'Error creating squads' });
      }
    });

  } catch (error) {
    console.error('Error creating squads:', error);
    res.status(500).json({ error: 'Error creating squads' });
  }
});

// Create manual squad
router.post('/', (req, res) => {
  const { name, memberIds } = req.body;

  if (!name || !memberIds || !Array.isArray(memberIds)) {
    return res.status(400).json({ error: 'Squad name and member IDs are required' });
  }

  // First verify that all member IDs have present attendance status
  const placeholders = memberIds.map(() => '?').join(',');
  db.all(`
    SELECT c.id, c.name, a.status
    FROM candidates c
    LEFT JOIN attendance a ON c.id = a.candidate_id
    WHERE c.id IN (${placeholders})
  `, memberIds, (err, candidates) => {
    if (err) {
      console.error('Error verifying candidates:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if all candidates have present status
    const nonPresentCandidates = candidates.filter(c => c.status !== 'present');
    if (nonPresentCandidates.length > 0) {
      return res.status(400).json({ 
        error: `Cannot add candidates without present status: ${nonPresentCandidates.map(c => c.name).join(', ')}` 
      });
    }

    // Create the squad
    db.run('INSERT INTO squads (name) VALUES (?)', [name], function(err) {
      if (err) {
        console.error('Error creating squad:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const squadId = this.lastID;

      // Add members to squad
      memberIds.forEach(candidateId => {
        db.run('INSERT INTO squad_members (squad_id, candidate_id) VALUES (?, ?)', 
          [squadId, candidateId]);
      });

      res.json({
        message: 'Squad created successfully',
        squad: {
          id: squadId,
          name,
          memberIds
        }
      });
    });
  });
});

// Get available candidates for squad formation (only present ones)
router.get('/available-candidates', (req, res) => {
  db.all(`
    SELECT DISTINCT c.* 
    FROM candidates c
    INNER JOIN attendance a ON c.id = a.candidate_id
    WHERE a.status = 'present'
    AND c.id NOT IN (
      SELECT DISTINCT candidate_id 
      FROM squad_members
    )
    ORDER BY c.name
  `, (err, candidates) => {
    if (err) {
      console.error('Error fetching available candidates:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(candidates);
  });
});

// Get all squads with members
router.get('/', (req, res) => {
  db.all(`
    SELECT s.*, 
           GROUP_CONCAT(c.name) as member_names,
           GROUP_CONCAT(c.id) as member_ids,
           COUNT(sm.candidate_id) as member_count
    FROM squads s
    LEFT JOIN squad_members sm ON s.id = sm.squad_id
    LEFT JOIN candidates c ON sm.candidate_id = c.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, (err, squads) => {
    if (err) {
      console.error('Error fetching squads:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse member names and IDs
    const formattedSquads = squads.map(squad => ({
      ...squad,
      member_names: squad.member_names ? squad.member_names.split(',') : [],
      member_ids: squad.member_ids ? squad.member_ids.split(',').map(id => parseInt(id)) : []
    }));

    res.json(formattedSquads);
  });
});

// Clear all squads
router.delete('/clear-all', (req, res) => {
  // Delete all squad members first
  db.run('DELETE FROM squad_members', (err) => {
    if (err) {
      console.error('Error deleting squad members:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Delete all squads
    db.run('DELETE FROM squads', function(err) {
      if (err) {
        console.error('Error deleting squads:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ 
        message: 'All squads cleared successfully',
        deletedSquads: this.changes
      });
    });
  });
});

// Get squad by ID with detailed member info
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM squads WHERE id = ?', [id], (err, squad) => {
    if (err) {
      console.error('Error fetching squad:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Get squad members
    db.all(`
      SELECT c.*, sm.role
      FROM squad_members sm
      JOIN candidates c ON sm.candidate_id = c.id
      WHERE sm.squad_id = ?
      ORDER BY c.name
    `, [id], (err, members) => {
      if (err) {
        console.error('Error fetching squad members:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        ...squad,
        members
      });
    });
  });
});

// Update squad
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, memberIds } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Squad name is required' });
  }

  db.run('UPDATE squads SET name = ? WHERE id = ?', [name, id], function(err) {
    if (err) {
      console.error('Error updating squad:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Update members if provided
    if (memberIds && Array.isArray(memberIds)) {
      // Remove existing members
      db.run('DELETE FROM squad_members WHERE squad_id = ?', [id], (err) => {
        if (err) {
          console.error('Error removing squad members:', err);
          return;
        }

        // Add new members
        memberIds.forEach(candidateId => {
          db.run('INSERT INTO squad_members (squad_id, candidate_id) VALUES (?, ?)', 
            [id, candidateId]);
        });
      });
    }

    res.json({ message: 'Squad updated successfully' });
  });
});

// Delete squad
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Delete squad members first
  db.run('DELETE FROM squad_members WHERE squad_id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting squad members:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Delete squad
    db.run('DELETE FROM squads WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting squad:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Squad not found' });
      }

      res.json({ message: 'Squad deleted successfully' });
    });
  });
});

module.exports = router; 