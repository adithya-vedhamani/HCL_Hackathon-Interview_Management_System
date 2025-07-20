const express = require('express');
const natural = require('natural');
const db = require('../database');

const router = express.Router();

// Initialize NLP tokenizer
const tokenizer = new natural.WordTokenizer();

// Skill categories and synonyms for better matching
const skillCategories = {
  'frontend': ['javascript', 'js', 'react', 'vue', 'angular', 'html', 'css', 'typescript', 'sass', 'less', 'bootstrap', 'tailwind', 'jquery', 'dom', 'ajax', 'fetch', 'axios'],
  'backend': ['node.js', 'nodejs', 'python', 'django', 'flask', 'express', 'java', 'spring', 'php', 'laravel', 'c#', '.net', 'asp.net', 'ruby', 'rails', 'go', 'golang', 'rust'],
  'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'nosql', 'firebase', 'supabase', 'dynamodb'],
  'devops': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible', 'nginx', 'apache'],
  'mobile': ['react native', 'flutter', 'ios', 'swift', 'android', 'kotlin', 'java', 'xamarin', 'ionic', 'cordova'],
  'ai_ml': ['machine learning', 'ml', 'artificial intelligence', 'ai', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'nlp', 'natural language processing', 'deep learning', 'neural networks'],
  'data_science': ['data science', 'data analysis', 'statistics', 'r', 'matlab', 'jupyter', 'tableau', 'power bi', 'excel', 'spss', 'sas'],
  'design': ['ui/ux', 'ui', 'ux', 'figma', 'adobe', 'photoshop', 'illustrator', 'sketch', 'invision', 'prototyping', 'wireframing', 'user research', 'usability testing'],
  'blockchain': ['blockchain', 'ethereum', 'bitcoin', 'solidity', 'web3', 'smart contracts', 'defi', 'nft', 'cryptocurrency'],
  'cybersecurity': ['security', 'cybersecurity', 'penetration testing', 'ethical hacking', 'owasp', 'encryption', 'authentication', 'authorization', 'ssl', 'tls']
};

// Skill similarity mapping
const skillSynonyms = {
  'js': 'javascript',
  'nodejs': 'node.js',
  'reactjs': 'react',
  'vuejs': 'vue',
  'angularjs': 'angular',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'ui': 'ui/ux',
  'ux': 'ui/ux',
  'ui/ux design': 'ui/ux',
  'data analysis': 'data science',
  'statistical analysis': 'data science',
  'web development': 'frontend',
  'full stack': 'fullstack',
  'full-stack': 'fullstack',
  'fullstack development': 'fullstack'
};

// NLP-enhanced skill processing
const processSkillsWithNLP = (skillsString) => {
  if (!skillsString) return [];
  
  // Tokenize and clean skills
  const tokens = tokenizer.tokenize(skillsString.toLowerCase());
  const cleanedSkills = tokens.filter(token => token.length > 1);
  
  // Normalize skills using synonyms
  const normalizedSkills = cleanedSkills.map(skill => {
    return skillSynonyms[skill] || skill;
  });
  
  // Categorize skills
  const categorizedSkills = {};
  normalizedSkills.forEach(skill => {
    for (const [category, categorySkills] of Object.entries(skillCategories)) {
      if (categorySkills.includes(skill)) {
        if (!categorizedSkills[category]) {
          categorizedSkills[category] = [];
        }
        categorizedSkills[category].push(skill);
      }
    }
  });
  
  const result = {
    raw: normalizedSkills,
    categorized: categorizedSkills,
    categories: Object.keys(categorizedSkills)
  };
  
  console.log(`NLP Processing: "${skillsString}" →`, result);
  return result;
};

// Calculate skill similarity between two candidates
const calculateSkillSimilarity = (skills1, skills2) => {
  const set1 = new Set(skills1.raw);
  const set2 = new Set(skills2.raw);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size; // Jaccard similarity
};

// Calculate skill diversity score
const calculateDiversityScore = (candidateSkills, allSkills) => {
  const skillFrequency = {};
  
  // Count frequency of each skill across all candidates
  allSkills.forEach(skills => {
    skills.raw.forEach(skill => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
  });
  
  // Calculate rarity score (inverse frequency)
  const rarityScore = candidateSkills.raw.reduce((score, skill) => {
    return score + (1 / (skillFrequency[skill] || 1));
  }, 0);
  
  // Bonus for having skills from different categories
  const categoryBonus = candidateSkills.categories.length * 0.5;
  
  return rarityScore + categoryBonus;
};

// Smart squad formation algorithm with NLP
const formSquadsWithAlgorithm = (candidates, squadSize, formationType) => {
  try {
    console.log(`Forming squads with ${formationType} skillset, size: ${squadSize}`);
    
    // Process skills with NLP for each candidate
    const candidatesWithNLP = candidates.map(candidate => ({
      ...candidate,
      skills: processSkillsWithNLP(candidate.skills)
    }));
    
    let squads = [];
    
    if (formationType === 'similar') {
      squads = formSimilarSquadsWithNLP(candidatesWithNLP, squadSize);
    } else if (formationType === 'diverse') {
      squads = formDiverseSquadsWithNLP(candidatesWithNLP, squadSize);
    } else {
      // Fallback to random
      squads = formSquadsRandom(candidates, squadSize);
    }
    
    console.log('NLP Algorithm squads:', squads);
    return squads;
  } catch (error) {
    console.error('NLP Algorithm squad formation error:', error);
    // Fallback to random formation
    return formSquadsRandom(candidates, squadSize);
  }
};

// Form squads with similar skills using NLP
const formSimilarSquadsWithNLP = (candidates, squadSize) => {
  const squads = [];
  const used = new Set();
  
  // Group candidates by skill categories
  const categoryGroups = {};
  
  candidates.forEach(candidate => {
    candidate.skills.categories.forEach(category => {
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(candidate);
    });
  });
  
  // Sort categories by number of candidates (most popular first)
  const sortedCategories = Object.keys(categoryGroups).sort((a, b) => 
    categoryGroups[b].length - categoryGroups[a].length
  );
  
  // Create squads from category groups
  for (const category of sortedCategories) {
    const candidatesInCategory = categoryGroups[category].filter(c => !used.has(c.id));
    
    if (candidatesInCategory.length >= squadSize) {
      // Create full squad from this category
      const squad = candidatesInCategory.slice(0, squadSize).map(c => c.id);
      squads.push(squad);
      squad.forEach(id => used.add(id));
    } else if (candidatesInCategory.length > 0) {
      // Add remaining candidates to incomplete squads or create new ones
      candidatesInCategory.forEach(candidate => {
        if (used.has(candidate.id)) return;
        
        // Find a squad that needs members
        let added = false;
        for (let i = 0; i < squads.length; i++) {
          if (squads[i].length < squadSize) {
            squads[i].push(candidate.id);
            used.add(candidate.id);
            added = true;
            break;
          }
        }
        
        // If no squad found, create new one
        if (!added) {
          squads.push([candidate.id]);
          used.add(candidate.id);
        }
      });
    }
  }
  
  // Add remaining candidates to incomplete squads
  candidates.forEach(candidate => {
    if (used.has(candidate.id)) return;
    
    let added = false;
    for (let i = 0; i < squads.length; i++) {
      if (squads[i].length < squadSize) {
        squads[i].push(candidate.id);
        used.add(candidate.id);
        added = true;
        break;
      }
    }
    
    if (!added) {
      squads.push([candidate.id]);
      used.add(candidate.id);
    }
  });
  
  return squads;
};

// Form squads with diverse skills using NLP
const formDiverseSquadsWithNLP = (candidates, squadSize) => {
  const squads = [];
  const used = new Set();
  
  // Calculate diversity scores for all candidates
  const allSkills = candidates.map(c => c.skills);
  const candidatesWithDiversity = candidates.map(candidate => ({
    ...candidate,
    diversityScore: calculateDiversityScore(candidate.skills, allSkills)
  })).sort((a, b) => b.diversityScore - a.diversityScore);
  
  // Create squads ensuring category diversity
  for (let i = 0; i < candidatesWithDiversity.length; i += squadSize) {
    const squad = [];
    const squadCategories = new Set();
    
    // Add candidates to squad ensuring category diversity
    for (let j = i; j < Math.min(i + squadSize, candidatesWithDiversity.length); j++) {
      const candidate = candidatesWithDiversity[j];
      if (used.has(candidate.id)) continue;
      
      // Check if this candidate adds category diversity to the squad
      const hasNewCategories = candidate.skills.categories.some(category => !squadCategories.has(category));
      
      if (hasNewCategories || squad.length === 0) {
        squad.push(candidate.id);
        used.add(candidate.id);
        candidate.skills.categories.forEach(category => squadCategories.add(category));
      }
    }
    
    if (squad.length > 0) {
      squads.push(squad);
    }
  }
  
  // Add remaining candidates
  candidates.forEach(candidate => {
    if (used.has(candidate.id)) return;
    
    let added = false;
    for (let i = 0; i < squads.length; i++) {
      if (squads[i].length < squadSize) {
        squads[i].push(candidate.id);
        used.add(candidate.id);
        added = true;
        break;
      }
    }
    
    if (!added) {
      squads.push([candidate.id]);
      used.add(candidate.id);
    }
  });
  
  return squads;
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

      let squads = formSquadsWithAlgorithm(candidates, squadSize, formationType);
      
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

// Get all squads with members and pagination
router.get('/', (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  db.get('SELECT COUNT(*) as total FROM squads', (err, countResult) => {
    if (err) {
      console.error('Error counting squads:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const total = countResult.total;
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
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, squads) => {
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
      res.json({
        data: formattedSquads,
        total,
        page,
        pageSize: limit
      });
    });
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