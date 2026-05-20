const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM patients ORDER BY enrolled_at DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, trial, site, enrollment_status, enrolled_at, arm } = req.body;
    const r = await pool.query(
      `INSERT INTO patients (patient_id, trial, site, enrollment_status, enrolled_at, arm)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [patient_id, trial, site, enrollment_status || 'screening', enrolled_at || null, arm]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { patient_id, trial, site, enrollment_status, enrolled_at, arm } = req.body;
    const r = await pool.query(
      `UPDATE patients SET patient_id=$1, trial=$2, site=$3, enrollment_status=$4, enrolled_at=$5, arm=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [patient_id, trial, site, enrollment_status, enrolled_at || null, arm, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM patients WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deleted', patient: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
