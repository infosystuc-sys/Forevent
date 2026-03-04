import './page.css';


export default function AboutUs() {

    return (
        <section className="aboutus-bg">
            <div className="flex flex-col items-center justify-center  h-[100vh] px-10 gap-7 md:gap-20 ">
                <h1 className={`font-sans font-bold text-center text-5xl sm:text-6xl md:text-6xl lg:text-8xl md:font-extrabold md:text-center whitespace-pre-line`}>
                    FOREVENT
                </h1>
                <p className={`font-sans text-xl md:text-2xl font-light text-center max-w-prose self-center`}>
                    Somos la App que integra una red social con la gestion administrativa de eventos y entretenimiento en una sola plataforma, lo que la convierte en una solucion innovadora en el mercado
                </p>
            </div>
            <div className="flex flex-col items-center justify-center w-vw h-[100vh] px-10 gap-7 md:gap-20 ">
                <div className="flex flex-col w-full px-10 gap-7 mb-20">
                    <h1 className={`font-sans  text-5xl sm:text-6xl md:text-6xl lg:text-8xl font-extrabold text-center`}>
                        Nuestra idea
                    </h1>
                    <p className={`font-sans text-xl md:text-3xl max-w-prose font-light text-center self-center`}>
                        Brindamos una experiencia de usuario dinámica al facilitar el conocimiento de los distintos puntos de entretenimiento que se encuentran a su alrededor y a su vez proporcionarle acceso rápido a los mismos
                    </p>
                </div>
            </div>
        </section>
    );
}

