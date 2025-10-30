import React from "react";
import Eyes from "./Eyes";

function LeftSectionAnimation() {
  return (
    <>
      <div className='left-section'>
        <div className='characters-container' id='characters'>
          {/* Satrt orange */}
          <div className={`character orange-half ${"fjlsdkf"}  `}>
            <div className='head d-flex align-items-center justify-content-center'>
              <Eyes color={"black"} width={"10px"} height={"10px"} />
              <div className='mouth'></div>
            </div>
          </div>
          {/* end orange */}
          {/* Start blue */}
          <div className='character purple-rect'>
            <div className=' d-flex align-items-center justify-content-center'>
              <div className='blue_head'>
                <Eyes
                  color={"white"}
                  width={"10px"}
                  height={"9px"}
                  delay={"2s"}
                />
                <div className='mouth_blue'></div>
              </div>
            </div>
          </div>
          {/* End blue */}
          {/* Start black */}
          <div className='character black-rect'>
            <div className='head d-flex align-items-center justify-content-center'>
              <Eyes
                color={"white"}
                width={"9px"}
                height={"9px"}
                delay={".6s"}
              />
            </div>
          </div>
          {/* End Black */}
          {/* Start yellow */}
          <div className='character yellow-pill'>
            <div className='head d-flex align-items-center justify-content-center'>
              <Eyes
                color={"black"}
                width={"10px"}
                height={"10px"}
                delay={"2.3s"}
              />
              <div className='mouth_yellow'></div>
            </div>
          </div>
          {/* End yellow */}
        </div>
      </div>
    </>
  );
}

export default LeftSectionAnimation;
