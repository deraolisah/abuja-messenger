import React from 'react';
import "./Hero.css";

const Hero = () => {
  return (
    <div className='hero'>
      <div className='hero-text'>
        <h1> Capturing the vibe, <br/> freezing the moment </h1>
        <p> Specialized in nuturing amazing pictures and moments you would always remember. </p>
        <button>Hero Button</button>
      </div>

      <div className='image-grid-wrapper'>
        <div className='image-grid'>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
          <div>
            <img src='https://placehold.co/400x600' alt='' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero;