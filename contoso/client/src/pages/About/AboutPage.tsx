import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../../services/statsService';
import type { EnrollmentDateGroup } from '../../types/stats';

const AboutPage: React.FC = () => {
  const [stats, setStats] = useState<EnrollmentDateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await statsService.fetchStudentStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className='container mt-4'>
        <div className='text-center'>
          <div className='spinner-border' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mt-4'>
      <h1>Student Body Statistics</h1>
      <p className='lead'>Enrollment statistics by date</p>

      {error && (
        <div className='alert alert-danger' role='alert'>
          {error}
        </div>
      )}

      <div className='card mt-4'>
        <div className='card-body'>
          {stats.length === 0 ? (
            <p className='text-muted'>No enrollment data available.</p>
          ) : (
            <div className='table-responsive'>
              <table className='table table-striped table-bordered'>
                <thead className='table-dark'>
                  <tr>
                    <th>Enrollment Date</th>
                    <th>Student Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.EnrollmentDate}>
                      <td>
                        {new Date(stat.EnrollmentDate).toLocaleDateString()}
                      </td>
                      <td>{stat.StudentCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className='table-light'>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>
                        {stats.reduce(
                          (sum, stat) => sum + stat.StudentCount,
                          0
                        )}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className='mt-3'>
        <Link to='/' className='btn btn-secondary'>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
