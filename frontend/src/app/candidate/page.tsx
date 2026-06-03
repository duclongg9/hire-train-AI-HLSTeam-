export default function CandidatePortal() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Candidate Application Portal</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">1. Submit Your CV</h2>
        <form className="space-y-4">
          <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Upload CV</button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-8">
        <h2 className="text-xl font-bold mb-4">2. AI Voice Interview Room</h2>
        <p className="mb-4 text-gray-600">Please wait here until your interview session is ready to begin.</p>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg" disabled>Enter Waiting Room</button>
      </div>
    </div>
  );
}
