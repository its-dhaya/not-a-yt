function TopicInput({ topic, setTopic, generateScript, loading }) {
  const handleKey = (e) => {
    if (e.key === "Enter" && !loading) generateScript();
  };

  return (
    <div className="card">
      <p className="card-title">Enter Topic</p>
      <div className="topic-row">
        <input
          className="topic-input"
          value={topic}
          placeholder="e.g. Ancient Rome, Black Holes, Tesla..."
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          className="btn-primary"
          onClick={generateScript}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Script"}
        </button>
      </div>
    </div>
  );
}

export default TopicInput;
