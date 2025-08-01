const express=require('express');
const router=express.Router();
const Committee=require('../models/committe_model');
const Member=require('../models/members_model')
const Conference=require('../models/conference_model');
const bodyParser = require('body-parser');
router.use(express.json());
  router.post('/create/:com_id', async (req, res) => {
    try {
      const { members } = req.body;
      const comId = req.params.com_id;

      // Find the committee
      const committee = await Committee.findById(comId);
      if (!committee) {
        return res.status(404).json({ error: 'Committee not found' });
      }

      const errors = [];
      const addedMembers = [];

      // Iterate through each member
      for (const member of members) {
        // Check if the member already exists
        const existingMember = await Member.findOne({ email: member.email });

        // If member already exists, check if they are already in the committee
        if (existingMember) {
          const existInCommittee = committee.members.includes(existingMember._id);
          if (existInCommittee) {
            errors.push({ email: member.email, error: `${member.name} already exists in this committee` });
          } else {
            // If member exists but not in committee, add them to the committee
            committee.members.push(existingMember._id);
            addedMembers.push(existingMember._id);
          }
        } else {
          // If member doesn't exist, create a new member and add them to the committee
          const newMember = new Member(member);
          const savedMember = await newMember.save();
          committee.members.push(savedMember._id);
          addedMembers.push(savedMember._id);
        }
      }

      // Save the updated committee
      await committee.save();

      // Respond with success message and errors if any
      if (errors.length > 0) {
        return res.status(400).json({ addedMembers, errors });
      } else {
        return res.status(201).json({ message: 'Members added successfully', addedMembers });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.put('/updateMember/:member_id', async (req, res) => {
    console.log('dfdfd');
    try {
       
        const { member_id } = req.params; // Member ID from the URL parameters
        const { name, role, email, affiliation, mobile,country } = req.body; // Member data to update

        // Find the member by their member_id
        const existingMember = await Member.findById(member_id);
        if (!existingMember) {
            return res.status(404).json({ error: `Member with ID ${member_id} not found` });
        }
      
        // Update the member's details with the new data or keep existing values
        existingMember.name = name || existingMember.name;
      
        
        existingMember.role = role || existingMember.role;
        existingMember.email = email || existingMember.email;
        existingMember.affiliation = affiliation || existingMember.affiliation;
        existingMember.mobile = mobile || existingMember.mobile;
        existingMember.country = country || existingMember.country;

        // Save the updated member
        await existingMember.save();

        // Respond with success message
        return res.status(200).json({ message: 'Member updated successfully', member: existingMember });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

  


router.get('/getmembersbycomid/:comid', async (req, res) => {
  try {
    const comId = req.params.comid;
    
    // Find the committee by ID and populate the 'members' field
    const committee = await Committee.findById(comId).populate('members');
    
    // If committee is found, send the members
    if (committee) {
      res.json(committee.members);
    } else {
      // If committee is not found, send 404 Not Found
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/allmembersexcurr/:id', async (req, res) => {
  try {
      const conid = req.params.id;
      const conferences = await Conference.find({ _id: { $ne: conid } }).populate({
          path: 'committee',
          populate: {
              path: 'members'
          }
      });
      
      if (conferences) { // Check if conferences array is not empty
          let allmembers = [];
          const allmembersSet = new Set();
        
          conferences.forEach(conference => {
                // Iterate through each track in the conference
              conference.committee.forEach(com => {
                    // Add members from each track to the allMembers array
                  com.members.forEach(member => allmembersSet.add(member));
              });
          });
          // Send the array of reviewers as the response
          allmembers=Array.from(allmembersSet);
          res.json(allmembers);
      } else {
          res.status(404).json({ error: 'No conferences found' });
      }
  } catch (error) {
      console.error("Error fetching conferences:", error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/allmembersbyconid/:id', async (req, res) => {
    try {
        const conid = req.params.id;
        const conference = await Conference.findById(conid).populate({
            path: 'committee',
            populate: {
                path: 'members'
            }
        });

        if (conference) { // Check if conference is found
            let allmembers = [];
            // Iterate through each track in the conference
            conference.committee.forEach(com => {
                // Add reviewers from each track to the allReviewers array
                allmembers.push(...com.members);
            });
            // Send the array of reviewers as the response
            res.json(allmembers);
        } else {
            res.status(404).json({ error: 'Conference not found' });
        }
    } catch (error) {
        console.error("Error fetching conference:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports=router;
