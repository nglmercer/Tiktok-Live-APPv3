const inituserpoints = () => {
    const userpoints = document.getElementById('userpoints');
    const userpointscheckbox = document.getElementById('userpointsCheckbox');
    if (userpointscheckbox.checked) {
        userpoints.style.display = 'block';
    } else {
        userpoints.style.display = 'none';
    }
}
function userpoints(data) {
    if (data.nickname) {
        if (userPoints[data.nickname]) {
            return userPoints[data.nickname];
        } else {
            return 10;
        }
    } else {
        return 10;
    }
}
function calculateuserpoints(data) {
    let userpoints = userpoints(data);
    if (userpoints) {
        userPoints[data.nickname] = userpoints;
        console.log('userpoints', userPoints[data.nickname]);
    }
}