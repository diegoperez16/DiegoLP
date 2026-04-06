import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './CardSwap.css';

export const Card = forwardRef(({ customClass, children, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()}>
    {children}
  </div>
));
Card.displayName = 'Card';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

const CardSwap = forwardRef(({
  width = 250,
  height = 250,
  cardDistance = 40,
  verticalDistance = 50,
  delay = 4000,
  pauseOnHover = true,
  isPaused = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children
}, ref) => {
  const config =
    easing === 'elastic'
      ? { ease: 'elastic.out(0.6,0.9)', durDrop: 1.2, durMove: 1.2, durReturn: 1.2, promoteOverlap: 0.9, returnDelay: 0.05 }
      : { ease: 'power3.inOut', durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const order       = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef       = useRef(null);
  const intervalRef = useRef(null);
  const container   = useRef(null);
  const cycleRef    = useRef();
  const swapRef     = useRef();

  // ── Core: animation setup — isPaused/delay not in deps ──────────────
  useEffect(() => {
    const total = refs.length;

    order.current.forEach((cardIdx, slotIdx) => {
      placeNow(refs[cardIdx].current, makeSlot(slotIdx, cardDistance, verticalDistance, total), skewAmount);
    });

    const swap = () => {
      if (order.current.length < 2) return;
      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, { y: '+=300', duration: config.durDrop, ease: config.ease });
      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el   = refs[idx].current;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.1}`);
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(() => gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, 'return');
      tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease }, 'return');
      tl.call(() => { order.current = [...rest, front]; });
    };

    swapRef.current = swap;

    const cycleForward = (count) => {
      if (count <= 0) return;
      if (tlRef.current) tlRef.current.kill();
      const newOrder = [...order.current];
      for (let k = 0; k < count; k++) newOrder.push(newOrder.shift());
      order.current = newOrder;
      newOrder.forEach((idx, i) => {
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        gsap.to(refs[idx].current, { x: slot.x, y: slot.y, z: slot.z, zIndex: slot.zIndex, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
    };
    cycleRef.current = cycleForward;

    // ── Hover lift via GSAP — avoids CSS filter/backface conflicts ──
    const hoverCleanups = refs.map((r, i) => {
      const el = r.current;
      const onEnter = () => {
        gsap.to(el, { y: `-=${18}`, scale: 1.06, duration: 0.3, ease: 'back.out(2)', overwrite: 'auto' });
      };
      const onLeave = () => {
        const slotIdx = order.current.indexOf(i);
        const slot = makeSlot(slotIdx, cardDistance, verticalDistance, refs.length);
        gsap.to(el, { y: slot.y, scale: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
      };
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      return () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      };
    });

    // Hover-pause container listeners
    const node = container.current;
    const pauseAuto  = () => clearInterval(intervalRef.current);
    const resumeAuto = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => swapRef.current?.(), delay);
    };
    if (pauseOnHover) {
      node.addEventListener('mouseenter', pauseAuto);
      node.addEventListener('mouseleave', resumeAuto);
    }

    return () => {
      hoverCleanups.forEach(fn => fn());
      if (pauseOnHover && node) {
        node.removeEventListener('mouseenter', pauseAuto);
        node.removeEventListener('mouseleave', resumeAuto);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, pauseOnHover, skewAmount, easing]);

  // ── Interval only — never re-places cards ───────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (isPaused) {
      // Only settle cards if an auto-swap timeline was actively mid-flight.
      // If cycleForward already handled positioning, don't double-animate.
      if (tlRef.current?.isActive()) {
        tlRef.current.kill();
        tlRef.current = null;
        order.current.forEach((cardIdx, slotIdx) => {
          const slot = makeSlot(slotIdx, cardDistance, verticalDistance, refs.length);
          gsap.to(refs[cardIdx].current, { x: slot.x, y: slot.y, z: slot.z, scale: 1, zIndex: slot.zIndex, duration: 0.35, ease: 'power3.out', overwrite: true });
        });
      } else if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => swapRef.current?.(), delay);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, delay]);

  useImperativeHandle(ref, () => ({
    next:       () => cycleRef.current?.(1),
    prev:       () => cycleRef.current?.(childArr.length - 1),
    frontIndex: () => order.current[0],
  }), [childArr.length]);

  const handleClick = (e, i) => {
    e.stopPropagation();
    const pos = order.current.indexOf(i);
    if (pos !== 0) cycleRef.current?.(pos);
    onCardClick?.(i);
  };

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: e => { child.props.onClick?.(e); handleClick(e, i); }
        })
      : child
  );

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
});

CardSwap.displayName = 'CardSwap';
export default CardSwap;
