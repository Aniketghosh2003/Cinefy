import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Ongoing from './pages/Ongoing';
import Search from './pages/Search';
import Recommendations from './pages/Recommendations';
import Genres from './pages/Genres';
import Grids from './pages/Grids';
import Community from './pages/Community';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ongoing" element={<Ongoing />} />
          <Route path="search" element={<Search />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="genres" element={<Genres />} />
          <Route path="grids" element={<Grids />} />
          <Route path="community" element={<Community />} />
          {/* We will add more routes here later */}
          <Route path="*" element={<div className="p-10 text-center">Page Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;