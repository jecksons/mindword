import { useCallback, useState } from "react";
import { ChangeGoalModal } from './ChangeGoalModal';


export function DailyScoreView({ score, onRefreshScore, currDay }) {

   const completedPerc = score.valid_items >= score.goal ? 100 : Math.floor(score.valid_items / score.goal * 100);
   const pendingPerc = score.valid_items >= score.goal ? 0 : (
      Math.floor(
         (
            (score.items > score.goal) ?
               (score.goal - score.valid_items) :
               (score.items - score.valid_items)
         ) / score.goal * 100)
   );
   const completedBorderRadius = completedPerc > 0 ?
      (
         pendingPerc > 0 ?
            '20px 0 0 20px' :
            '20px'
      ) : '0';
   const pendingBorderRadius = pendingPerc > 0 ?
      (
         completedPerc > 0 ?
            '0 20px 20px 0' :
            '20px'
      ) : '0';

   const [showChangeGoal, setShowChangeGoal] = useState(false);
   const [posModalChange, setPosModalChange] = useState({ top: 0, right: 0 });


   const handleShowNewGoal = useCallback((target) => {
      const rect = target.getBoundingClientRect();
      setPosModalChange({ top: Math.floor(rect.bottom + 8), right: Math.floor(rect.right + 8) });
      setShowChangeGoal(true);
   }, []);

   return (
      <section className="col align-end pos-relative">
         <button className="btn-link" onClick={(e) => showChangeGoal ? setShowChangeGoal(false) : handleShowNewGoal(e.target)}  >Alterar a meta diária</button>
         {score.goal > 0 &&
            (
               <div className="score-progress-parent">
                  <div className="score-progress"
                     style={{
                        '--progress-complete': completedPerc + '%',
                        '--pending-items': pendingPerc + "%",
                        '--complete-border-radius': completedBorderRadius,
                        '--pending-border-radius': pendingBorderRadius
                     }}
                  > </div>
               </div>
            )
         }
         <label className={'font-bold font-87 color-black-3'}>
            {`${score.valid_items}/${score.goal}`}
         </label>
         {showChangeGoal && <ChangeGoalModal
            onRequestClose={() => setShowChangeGoal(false)}
            currGoal={score.goal}
            currDay={currDay}
            onSaved={onRefreshScore}
            position={posModalChange} />}
      </section>
   )
}