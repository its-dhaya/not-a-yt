function TopicInput({ topic, setTopic, generateScript, loading }) {
  return (
    <div className="card">
      <h3>Enter Topic</h3>

      <div className="input-row">
        <input
          className="input"
          value={topic}
          placeholder="Enter topic..."
          onChange={(e) => setTopic(e.target.value)}
        />

        <button className="btn primary" onClick={generateScript}>
          Generate Script
        </button>
      </div>

      {loading && <p>Generating script...</p>}
    </div>
  );
}

export default TopicInput;
