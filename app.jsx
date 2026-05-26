function App() {
  return (
    <>
      <Environment />
      <Nav />
      <div className="app">
        <Hero />
        <Marquee />
        <About />
        <Services />
        <Industries />
        <Portfolio />
        <Contact />
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
