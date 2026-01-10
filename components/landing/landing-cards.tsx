"use client"

import {
  MacNoteCard,
  BiologyNoteContent,
  CalculusNoteContent,
  LiteratureNoteContent,
  ChemistryNoteContent,
  HistoryNoteContent,
} from "./mac-note-card"

export function LandingCards() {
  return (
    <div className="cards-container">
      {/* Left card - Biology */}
      <MacNoteCard
        title="Biology 101"
        content={<BiologyNoteContent />}
        className="card-left"
        delay={200}
        rotation={-8}
        offsetX={-520}
        offsetY={40}
      />

      {/* Center-left card - Calculus */}
      <MacNoteCard
        title="Calculus II"
        content={<CalculusNoteContent />}
        className="card-center-left"
        delay={400}
        rotation={-3}
        offsetX={-260}
        offsetY={20}
      />

      {/* Center card - Literature (featured) */}
      <MacNoteCard
        title="English Literature"
        content={<LiteratureNoteContent />}
        className="card-center"
        delay={100}
        rotation={0}
        offsetX={0}
        offsetY={-10}
      />

      {/* Center-right card - Chemistry */}
      <MacNoteCard
        title="Chemistry 201"
        content={<ChemistryNoteContent />}
        className="card-center-right"
        delay={300}
        rotation={5}
        offsetX={260}
        offsetY={30}
      />

      {/* Right card - History */}
      <MacNoteCard
        title="World History"
        content={<HistoryNoteContent />}
        className="card-right"
        delay={500}
        rotation={10}
        offsetX={520}
        offsetY={80}
      />

      <style>{`
        .cards-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          height: 550px;
          margin-top: 3rem;
          z-index: 5;
        }

        /* Position each card */
        .card-left {
          left: 50%;
          top: 50px;
          z-index: 1;
        }

        .card-center-left {
          left: 50%;
          top: 30px;
          z-index: 3;
        }

        .card-center {
          left: 50%;
          top: 0;
          z-index: 5;
        }

        .card-center-right {
          left: 50%;
          top: 40px;
          z-index: 2;
        }

        .card-right {
          left: 50%;
          top: 60px;
          z-index: 1;
        }

        @media (max-width: 1200px) {
          .card-left {
            --offset-x: -400px !important;
          }
          .card-center-left {
            --offset-x: -200px !important;
          }
          .card-center {
            --offset-x: 0px !important;
          }
          .card-center-right {
            --offset-x: 200px !important;
          }
          .card-right {
            display: none;
          }
        }

        @media (max-width: 900px) {
          .card-left {
            --offset-x: -280px !important;
            --rotation: -6deg !important;
          }
          .card-center-left {
            --offset-x: -100px !important;
          }
          .card-center {
            --offset-x: 80px !important;
          }
          .card-center-right {
            --offset-x: 260px !important;
            --rotation: 4deg !important;
          }
        }

        @media (max-width: 768px) {
          .cards-container {
            height: 400px;
            margin-top: 2rem;
          }

          .card-left {
            --offset-x: -180px !important;
            --offset-y: 20px !important;
          }
          .card-center-left {
            display: none;
          }
          .card-center {
            --offset-x: 0px !important;
            --offset-y: -20px !important;
          }
          .card-center-right {
            --offset-x: 180px !important;
            --offset-y: 20px !important;
          }
        }

        @media (max-width: 600px) {
          .cards-container {
            height: 350px;
          }
          .card-left {
            --offset-x: -120px !important;
          }
          .card-center-right {
            --offset-x: 120px !important;
          }
        }
      `}</style>
    </div>
  )
}

