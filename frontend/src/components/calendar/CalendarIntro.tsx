"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function Robot({ onAnimationComplete, onReveal }: { onAnimationComplete: () => void, onReveal: () => void }) {
  const group = useRef<THREE.Group>(null);

  const { scene, animations } = useGLTF("/RobotExpressive.glb");
  const { actions } = useAnimations(animations, group);

  // State machine: "entering" -> "action" -> "runOff" -> "complete"
  const [phase, setPhase] = useState("entering");

  useEffect(() => {
    if (!actions) return;

    let transitionTimer: any;
    let finishTimer: any;

    if (phase === "entering") {
      // 1. Walk in
      const walkAction = actions["Walking"];
      walkAction?.reset().fadeIn(0.5).play();

      transitionTimer = setTimeout(() => {
        setPhase("action");
      }, 2500);

    } else if (phase === "action") {
      // 2. Stop walking, give Thumbs Up
      actions["Walking"]?.fadeOut(0.5);
      const thumbsUp = actions["ThumbsUp"];
      if (thumbsUp) {
        thumbsUp.reset().fadeIn(0.5);
        thumbsUp.setLoop(THREE.LoopOnce, 1);
        thumbsUp.clampWhenFinished = true;
        thumbsUp.play();
      }

      transitionTimer = setTimeout(() => {
        setPhase("runOff");
      }, 2000);

    } else if (phase === "runOff") {
      // 3. Trigger reveal animation in parent immediately
      onReveal();

      // 4. Run away fast!
      actions["ThumbsUp"]?.fadeOut(0.3);
      const runAction = actions["Running"];

      if (runAction) {
        runAction.reset().fadeIn(0.3).timeScale = 1.5; // Run fast
        runAction.play();
      } else {
        actions["Walking"]?.reset().fadeIn(0.3).play();
        if (actions["Walking"]) actions["Walking"].timeScale = 2;
      }

      finishTimer = setTimeout(() => {
        onAnimationComplete();
      }, 1500);
    }

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(finishTimer);
    };
  }, [actions, phase, onAnimationComplete, onReveal]);

  useFrame((state, delta) => {
    if (!group.current) return;

    if (phase === "entering") {
      group.current.position.x += 2 * delta;
      group.current.rotation.y = Math.PI / 2 + 0.3;

    } else if (phase === "action") {
      // Turn to face the user 
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);

    } else if (phase === "runOff") {
      // Robot runs away
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI / 2, 0.2);
      group.current.position.x += 6 * delta;
    }
  });

  return (
    <group ref={group} position={[-5, -2.5, 0]} dispose={null}>
      <primitive object={scene} scale={[1, 1, 1]} />
    </group>
  );
}

// Preload to ensure smooth rendering
useGLTF.preload("/RobotExpressive.glb");

export function CalendarIntro({ onComplete, onReveal }: { onComplete: () => void, onReveal: () => void }) {
  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative select-none pointer-events-none">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={50} />
        <ambientLight intensity={1} />
        <directionalLight position={[-5, 5, 5]} intensity={2} castShadow />
        <directionalLight position={[5, 10, -5]} intensity={0.5} />

        <Environment preset="city" />

        <Robot onAnimationComplete={onComplete} onReveal={onReveal} />

        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
      </Canvas>
    </div>
  );
}
