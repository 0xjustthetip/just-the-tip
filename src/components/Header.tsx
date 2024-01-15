import tiplogo from '../assets/coqtip.png'

function Header() {
    return (
        <div className='flex flex-col w-72 items-center'>
            <img src={tiplogo} className="h-64 w-64" alt="CoqTip logo" />
            <div className='flex flex-col items-center  '>
                <p className='text-3xl text-slate-200'>
                    Just
                </p>
                <p className='text-xl text-slate-200'>
                    The
                </p>
                <p className='text-5xl text-slate-200'>
                    Tip
                </p>

                <p className='text-lg text-gray-400 pt-10'>
                    In COQ we trust
                </p>

            </div>

        </div>
    );
}

export default Header