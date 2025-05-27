import React, { useEffect, useState } from "react";

const SummaryList = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/videos")
      .then((res) => res.json())
      .then((data) => {
        setSummaries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch summaries:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div
      style={{ maxWidth: 800, margin: "2rem auto", fontFamily: "sans-serif" }}
    >
      <h1>NoteCrunch Summaries</h1>
      {summaries.length === 0 ? (
        <p>No summaries found.</p>
      ) : (
        summaries.map((item) => (
          <div
            key={item.id}
            style={{ borderBottom: "1px solid #ccc", padding: "1rem 0" }}
          >
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default SummaryList;
